import { closeDatabase, connectDatabase, database } from "../config/db.js";

const seedProducts = [
  ["noor-embroidered-three-piece", "Noor Embroidered Three Piece", "Delicate embroidery for graceful everyday elegance.", "A beautifully detailed three-piece outfit with an embroidered kameez, coordinated trousers and a light dupatta. Designed for comfortable gatherings and special daytime occasions.", 2850, "Premium", 12, true],
  ["sage-serenity-lawn-suit", "Sage Serenity Lawn Suit", "A fresh, breathable lawn suit in a calming sage shade.", "This easy-wearing lawn three-piece pairs a clean silhouette with a soft, coordinated dupatta. A versatile choice for warm days and casual visits.", 1650, "Casual", 20, true],
  ["rose-bloom-three-piece", "Rose Bloom Three Piece", "Romantic floral details for memorable celebrations.", "A celebration-ready three-piece featuring floral accents, a polished kameez and matching separates. Style it for festive dinners and family occasions.", 3200, "Party Wear", 8, true],
  ["midnight-grace-suit", "Midnight Grace Suit", "A refined dark-toned suit with understated detailing.", "A sophisticated three-piece outfit in a rich midnight palette. Its elegant finish and coordinated pieces make it suitable for evening gatherings.", 2950, "Premium", 10, false],
  ["golden-petal-lawn", "Golden Petal Lawn", "Lightweight lawn with a warm, graceful floral look.", "Made for comfortable daytime wear, this lawn three-piece brings together a softly patterned kameez, matching trousers and coordinating dupatta.", 1450, "Casual", 18, false],
  ["black-pearl-formal", "Black Pearl Formal", "A polished formal look with timeless black styling.", "A formal three-piece designed for evening occasions, with subtle accents and coordinated separates for a composed, elegant finish.", 3600, "Party Wear", 6, true],
  ["lavender-mist-three-piece", "Lavender Mist Three Piece", "Soft lavender tones meet a comfortable everyday silhouette.", "A relaxed three-piece in a gentle lavender palette, with a breathable feel and easy-to-style coordinated pieces for everyday occasions.", 1800, "Casual", 15, false],
  ["ruby-elegance-suit", "Ruby Elegance Suit", "A rich ruby-inspired outfit for festive moments.", "This occasion-focused three-piece combines a striking color story with coordinated separates for a confident and graceful celebration look.", 3400, "Party Wear", 7, true],
];

try {
  await connectDatabase();
  const now = new Date();
  const collection = database.collection("products");
  const operations = seedProducts.map(
    ([seedKey, title, shortDescription, description, price, category, stock, featured]) => ({
      updateOne: {
        filter: { seedKey },
        update: {
          $setOnInsert: {
            title,
            shortDescription,
            description,
            price,
            category,
            image: "",
            sizes: ["M", "L", "XL"],
            stock,
            featured,
            createdBy: null,
            createdAt: now,
            updatedAt: now,
            seedKey,
            isDemo: true,
          },
        },
        upsert: true,
      },
    }),
  );
  const result = await collection.bulkWrite(operations, { ordered: true });
  console.log(
    `Seed complete: ${result.upsertedCount} demo products inserted; existing seed records were left unchanged.`,
  );
} finally {
  await closeDatabase();
}
