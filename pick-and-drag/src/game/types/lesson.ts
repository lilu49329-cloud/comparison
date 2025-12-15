export type LessonConcept = 'HEIGHT' | 'LENGTH' | 'SIZE' | 'WIDTH' | 'QUANTITY';

export type QuestionMode = 'BINARY_PICK' | 'MAX_IN_GROUP' | 'MIN_IN_GROUP';

export type LessonItemOption = {
    id: string;
    image: string; // path public/assets/...
    label?: string;
    value: number; // mức độ cao/dài/to…
};

export type LessonItem = {
    id: string;
    promptText?: string;
    promptAudio?: string;
    mode?: QuestionMode;
    options: LessonItemOption[];
    correctOptionId: string;
    difficulty: 1 | 2 | 3;
};

export type LessonPackage = {
    lessonId: string;
    title: string;
    concept: LessonConcept;
    defaultMode: QuestionMode;
    defaultPromptText: string;
    defaultPromptAudio?: string;
    items: LessonItem[];
};
