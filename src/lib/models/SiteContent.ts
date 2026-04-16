import mongoose, { type Document, type Model } from 'mongoose';

export interface ISiteContent extends Document {
  key: string;
  artistName: string;
  tagline: string;
  heroText: string;
  aboutBio: string;
  aboutPortraitUrl: string;
}

const SiteContentSchema = new mongoose.Schema<ISiteContent>({
  key: { type: String, required: true, unique: true },
  artistName: { type: String, default: '' },
  tagline: { type: String, default: '' },
  heroText: { type: String, default: '' },
  aboutBio: { type: String, default: '' },
  aboutPortraitUrl: { type: String, default: '' },
});

export const SiteContent: Model<ISiteContent> =
  mongoose.models.SiteContent ??
  mongoose.model<ISiteContent>('SiteContent', SiteContentSchema);
