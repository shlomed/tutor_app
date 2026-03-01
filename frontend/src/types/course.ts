export interface Course {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
}

export interface SubTopic {
  id: number;
  name: string;
}

export interface Topic {
  id: number;
  name: string;
  subtopics: SubTopic[];
}

export interface Subject {
  id: number;
  name: string;
  topics: Topic[];
}

export type SyllabusTree = Subject[];

export interface FlatSyllabusRow {
  subject_id: number;
  subject_name: string;
  topic_id: number;
  topic_name: string;
  subtopic_id: number;
  subtopic_name: string;
}

export interface SyllabusSchema {
  subjects: {
    name: string;
    topics: {
      name: string;
      subtopics: { name: string }[];
    }[];
  }[];
}

export interface SyllabusSaveCounts {
  subjects: number;
  topics: number;
  subtopics: number;
}
