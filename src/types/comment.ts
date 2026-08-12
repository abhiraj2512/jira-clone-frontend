export interface Comment {
  id: string;
  issueId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: {
    email: string;
    fullName: string;
  };
}

export interface CreateCommentInput {
  content: string;
}

export interface UpdateCommentInput {
  content: string;
}
