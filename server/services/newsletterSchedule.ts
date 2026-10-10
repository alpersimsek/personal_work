import { db } from '../db/knex.js';
import { findById, type BlogPostRow } from '../repositories/postsRepo.js';
import { cancelPendingDeliveries } from '../repositories/newsletterDeliveriesRepo.js';
import { newsletterBroadcastConfig } from '../config/newsletterBroadcast.js';

/**
 * Applies the newsletter rules after any create, update or publish toggle.
 *
 * A post is scheduled when it is published, opted in, never sent and not
 * already scheduled. `newsletter_sent_at` is the once-only guard: the
 * migration set it for every post that was live before this feature, so
 * editing or re-publishing those never emails anyone.
 */
export async function syncNewsletterSchedule(post: BlogPostRow): Promise<BlogPostRow> {
  const eligible = post.published && post.newsletter_enabled;
  if (eligible && !post.newsletter_sent_at && !post.newsletter_scheduled_at) {
    await db('blog_posts')
      .where({ id: post.id })
      .whereNull('newsletter_sent_at')
      .whereNull('newsletter_scheduled_at')
      .update({ newsletter_scheduled_at: db.raw('DATE_ADD(NOW(), INTERVAL ? MINUTE)', [newsletterBroadcastConfig().delayMinutes]) });
  } else if (!eligible) {
    await db('blog_posts').where({ id: post.id }).whereNull('newsletter_sent_at')
      .update({ newsletter_scheduled_at: null });
    await cancelPendingDeliveries(post.id);
  }
  return (await findById(post.id)) ?? post;
}
