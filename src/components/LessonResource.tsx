import React, { useState } from 'react';
import { LessonSection } from '../types';
import { LessonContent } from './LessonContent';
import { LessonPractice } from './LessonPractice';
import { youtubeEmbed } from '../../shared/lessonAuthoring';
export const LessonResource: React.FC<{ lesson: LessonSection }> = ({ lesson }) => {
    const [practice, setPractice] = useState(false);
    let video = '';
    try { video = youtubeEmbed(lesson.video_url || ''); } catch { /* legacy non-YouTube media can be viewed on the Learning page */ }
    return <div className="space-y-3">{lesson.content && <LessonContent content={lesson.content}/>}{video && <iframe title={lesson.title} src={video} className="w-full aspect-video rounded-xl" sandbox="allow-scripts allow-same-origin allow-presentation" allowFullScreen/>}{lesson.matrix_id && (practice ? <LessonPractice unitId={lesson.unit_id} matrixId={lesson.matrix_id}/> : <button onClick={() => setPractice(true)} className="text-sm bg-indigo-600 text-white rounded-xl px-4 py-2 font-semibold">Luyện theo ma trận bài học này</button>)}</div>;
};
