export interface LibraryBook {
  id: string;
  bookName: string;
  author: string;
  category: 'Textbook' | 'Reference Book' | 'Science Fiction' | 'Literature' | 'History' | 'Biography';
  isbn: string;
  quantity: number;
  available: number;
}

export interface LibraryIssueHistory {
  id: string;
  studentId: string;
  studentName: string;
  bookId: string;
  bookName: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'Issued' | 'Returned' | 'Overdue';
}
