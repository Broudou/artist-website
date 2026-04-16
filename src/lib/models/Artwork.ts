import mongoose, { type Document, type Model } from 'mongoose';

export interface PrintSize {
  label: string;
  price: number;
}

export interface IArtwork extends Document {
  title: string;
  slug: string;
  description: string;
  category: 'drawing' | 'photo';
  medium: string;
  year: number;
  imageUrl: string;
  thumbnailUrl: string;
  price: number | null;
  printSizes: PrintSize[];
  available: boolean;
  featured: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const PrintSizeSchema = new mongoose.Schema<PrintSize>(
  {
    label: { type: String, required: true },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const ArtworkSchema = new mongoose.Schema<IArtwork>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    category: { type: String, enum: ['drawing', 'photo'], required: true },
    medium: { type: String, default: '' },
    year: { type: Number, default: () => new Date().getFullYear() },
    imageUrl: { type: String, required: true },
    thumbnailUrl: { type: String, required: true },
    price: { type: Number, default: null },
    printSizes: { type: [PrintSizeSchema], default: [] },
    available: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const Artwork: Model<IArtwork> =
  mongoose.models.Artwork ?? mongoose.model<IArtwork>('Artwork', ArtworkSchema);
