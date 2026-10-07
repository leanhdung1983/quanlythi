import express from 'express';
import { beforeAll, beforeEach, afterAll, expect, it, vi } from 'vitest';
const { pool, conn } = vi.hoisted(() => ({
    pool:{query:vi.fn(),getConnection:vi.fn()},
    conn:{query:vi.fn(),beginTransaction:vi.fn(),commit:vi.fn(),rollback:vi.fn(),release:vi.fn()},
}));
vi.mock('./core.js',()=>({pool,requireAdmin:()=>true}));
let server, base;
const token='a'.repeat(64);
beforeAll(async()=>{
    pool.getConnection.mockResolvedValue(conn);
    const {default:router}=await import('./routes/tikzJobs.routes.js');
    const app=express();app.use(express.json());app.use((req,_res,next)=>{req.user={id:1};next();});app.use(router);
    server=await new Promise(resolve=>{const instance=app.listen(0,'127.0.0.1',()=>resolve(instance));});
    base=`http://127.0.0.1:${server.address().port}`;
});
beforeEach(()=>vi.clearAllMocks());
afterAll(()=>server?.close());
const post=(path,data)=>fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
it('accepts a repeated progress acknowledgement without counting it twice',async()=>{
    pool.query.mockImplementation(async sql=>sql.startsWith('UPDATE') ? [{affectedRows:0}] : [[{afterId:20,token,status:'RUNNING'}]]);
    const response=await post('/admin/tikz-jobs/8/progress',{token,afterId:20,synced:1,failed:0});
    expect(await response.json()).toEqual({success:true,duplicate:true});
    expect(pool.query.mock.calls[0][0]).toContain('after_id < ?');
});
it('accepts more than 100 drawings in a single question without stopping the job',async()=>{
    pool.query.mockResolvedValue([{affectedRows:1}]);
    const response=await post('/admin/tikz-jobs/8/progress',{token,afterId:20,synced:150,failed:0});
    expect(response.status).toBe(200);
});
it('repeating finish after a lost response returns success without changing terminal state',async()=>{
    conn.query.mockResolvedValue([[{status:'COMPLETED',lease_token:null}]]);
    const response=await post('/admin/tikz-jobs/8/finish',{token,status:'COMPLETED'});
    expect(await response.json()).toEqual({success:true});
    expect(conn.query).toHaveBeenCalledTimes(1);expect(conn.commit).toHaveBeenCalledOnce();
});
it('rejects a worker whose lease has been replaced',async()=>{
    conn.query.mockResolvedValue([[{status:'RUNNING',lease_token:'b'.repeat(64)}]]);
    const response=await post('/admin/tikz-jobs/8/finish',{token,status:'COMPLETED'});
    expect(response.status).toBe(409);expect(conn.query).toHaveBeenCalledTimes(1);
});
