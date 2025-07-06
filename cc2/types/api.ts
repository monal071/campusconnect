export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse {
  data: {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    image?: string;
  };
  likes: string[];
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    image?: string;
  };
  createdAt: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  type: 'in-person' | 'online' | 'hybrid';
  organizer: {
    id: string;
    name: string;
    contact: string;
  };
  attendees: string[];
  maxAttendees?: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'document' | 'link' | 'video' | 'other';
  url: string;
  author: {
    id: string;
    name: string;
  };
  tags: string[];
  likes: string[];
  downloads: number;
  createdAt: string;
  updatedAt: string;
}

export interface Connection {
  id: string;
  userId: string;
  connectedUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  details?: any;
  status: number;
}
