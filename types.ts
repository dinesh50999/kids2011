export interface Story {
  title: string;
  body: string;
  moral: string;
}

export interface IllustratedStory extends Story {
  imageUrls: string[];
}
