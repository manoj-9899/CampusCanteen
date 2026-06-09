import { z } from "zod";

export const MENU_CATEGORIES = [
  "Breakfast",
  "Snacks",
  "Meals",
  "Beverages",
  "Special",
] as const;

const name = z.string().trim().min(1, "Name is required.").max(80);
const description = z.string().trim().min(1, "Description is required.").max(300);
const price = z.number().positive("Price must be greater than zero.").max(9999);
const category = z.string().trim().min(1, "Category is required.").max(40);
const imageEmoji = z.string().trim().min(1).max(8).default("🍽️");

export const createMenuItemSchema = z.object({
  name,
  description,
  price,
  category,
  imageEmoji,
  isAvailable: z.boolean().default(true),
  stockQuantity: z.number().int().min(0).max(9999).default(0),
});

export const updateMenuItemSchema = z
  .object({
    name: name.optional(),
    description: description.optional(),
    price: price.optional(),
    category: category.optional(),
    imageEmoji: imageEmoji.optional(),
    isAvailable: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update.",
  });
