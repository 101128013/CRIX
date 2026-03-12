export interface Chapter {
  id: string;
  title: string;
  story: string;
  description: string;
  imagePrompts: string[];
}

export interface GeneratedImage {
  url: string;
  chapterId: string;
  prompt: string;
}
