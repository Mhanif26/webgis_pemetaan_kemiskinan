import { relations } from "drizzle-orm";
import { users, placesOfWorship, recipients, distributions } from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  managedPlaces: many(placesOfWorship),
}));

export const placesOfWorshipRelations = relations(placesOfWorship, ({ one, many }) => ({
  manager: one(users, {
    fields: [placesOfWorship.managerId],
    references: [users.id],
  }),
  recipients: many(recipients),
  distributions: many(distributions),
}));

export const recipientsRelations = relations(recipients, ({ one, many }) => ({
  placeOfWorship: one(placesOfWorship, {
    fields: [recipients.placeOfWorshipId],
    references: [placesOfWorship.id],
  }),
  distributions: many(distributions),
}));

export const distributionsRelations = relations(distributions, ({ one }) => ({
  placeOfWorship: one(placesOfWorship, {
    fields: [distributions.placeOfWorshipId],
    references: [placesOfWorship.id],
  }),
  recipient: one(recipients, {
    fields: [distributions.recipientId],
    references: [recipients.id],
  }),
}));
