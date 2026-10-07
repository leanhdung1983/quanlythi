import express from 'express';
import { afterAll, beforeAll, beforeEach, expect, it, vi } from 'vitest';
const { conn, query, clearCache } = vi.hoisted(() => ({
    conn: {query:vi.fn(),beginTransaction:vi.fn(),commit:vi.fn(),rollback:vi.fn(),release:vi.fn()},
    query:vi.fn(),clearCache:vi.fn(),
}));
vi.mock('./core.js',()=>({
    pool:{getConnection:async()=>conn,query:async()=>[[{count:0}]]},query,clearCache,
    requireAdmin:(req,res)=>{if(req.user.role==='ADMIN') return true; res.status(403).json({error:'Forbidden'});return false;},
    isAdmin:()=>true,requireTeacherOrAdmin:()=>true,canManageQuestion:async()=>true,
    generateHash:()=>'',sanitizeSvg:x=>x,resolveHierarchyIds:vi.fn(),getGradeDigitSQL:()=>'',cacheMiddleware:()=> (_req,_res,next)=>next(),
}));
let server, base;
beforeAll(async()=>{
    const {default:router}=await import('./routes/questions.routes.js');
    const app=express();app.use(express.json());
    app.use((req,_res,next)=>{req.user={id:1,role:req.headers['x-role'] || 'ADMIN'};next();});app.use(router);
    server=await new Promise(resolve=>{const instance=app.listen(0,'127.0.0.1',()=>resolve(instance));});
    base=`http://127.0.0.1:${server.address().port}`;
});
afterAll(()=>server?.close());
beforeEach(()=>{
    vi.clearAllMocks();
    conn.query.mockImplementation(async sql=>sql.startsWith('SELECT') ? [[{id:1,content_latex:'Same'},{id:2,content_latex:'Same'}]] : [{affectedRows:1}]);
});
it.each([['GET','/duplicates/find'],['POST','/duplicates/rehash'],['POST','/duplicates/resolve']])('rejects student and teacher access to %s %s',async(method,path)=>{
    for(const role of ['STUDENT','TEACHER']){
        const response=await fetch(base+path,{method,headers:{'x-role':role}});
        expect(response.status).toBe(403);
    }
    expect(query).not.toHaveBeenCalled();expect(conn.query).not.toHaveBeenCalled();
});
it('returns original content, actual type and date for duplicate comparison',async()=>{
    const rows=[1,2].map(id=>({id,raw_latex:'rendered.svg',original_latex:'Original source',created_at:'2026-10-07',q_type:'TF'}));
    query.mockResolvedValue(rows);
    const res=await fetch(base+'/duplicates/find');
    expect(await res.json()).toMatchObject({success:true,pending:0,groups:[rows]});
});
it('commits atomic resolution and invalidates question cache',async()=>{
    const res=await fetch(base+'/duplicates/resolve',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({groups:[{keepId:2,ids:[1,2]}]})});
    expect(await res.json()).toEqual({success:true,deleted:1});expect(conn.commit).toHaveBeenCalledOnce();expect(conn.release).toHaveBeenCalledOnce();expect(clearCache).toHaveBeenCalledOnce();
});
it('rolls back and returns conflict when a source has changed since the scan',async()=>{
    conn.query.mockResolvedValue([[{id:1,content_latex:'Old'},{id:2,content_latex:'New'}]]);
    const res=await fetch(base+'/duplicates/resolve',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({groups:[{keepId:2,ids:[1,2]}]})});
    expect(res.status).toBe(409);expect(conn.rollback).toHaveBeenCalledOnce();expect(conn.commit).not.toHaveBeenCalled();expect(clearCache).not.toHaveBeenCalled();
});
