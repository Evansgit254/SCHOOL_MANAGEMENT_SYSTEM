export interface ClassAssignmentRequest {
  id: number;
  student: {
    name: string;
    surname: string;
  } | null;
  createdAt: string;
}

export interface Class {
  id: number;
  name: string;
}

export interface ContactUser {
  id: string;
  username: string;
  name: string;
  surname: string;
  img?: string | null;
  type: 'teacher' | 'student' | 'parent';
  displayName: string;
  class?: {
    name: string;
  };
} 