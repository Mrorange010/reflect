import { supabase } from './supabase';

/**
 * Updates the user's streak, longest streak, and last_logged_date in the users table.
 * Call this after successfully creating a new daily or weekly log.
 * @param userId - The user's ID
 * @param newLogDate - The date of the new log (YYYY-MM-DD or Date object)
 */
export async function updateUserStreak(userId: string, newLogDate: string | Date) {
  const { data: user, error } = await supabase
    .from('users')
    .select('streak, longest_streak, last_logged_date')
    .eq('id', userId)
    .single();

  if (error || !user) return;

  const lastLoggedDate = user.last_logged_date ? new Date(user.last_logged_date) : null;
  const newLogDateObj = new Date(newLogDate);

  let newStreak = 1;
  let newLongestStreak = user.longest_streak || 0;

  if (lastLoggedDate) {
    const diffDays = Math.floor(
      (newLogDateObj.setHours(0,0,0,0) - lastLoggedDate.setHours(0,0,0,0)) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 1) {
      newStreak = (user.streak || 0) + 1;
    } else if (diffDays === 0) {
      newStreak = user.streak || 1;
    } else {
      newStreak = 1;
    }
  }

  if (newStreak > newLongestStreak) {
    newLongestStreak = newStreak;
  }

  await supabase
    .from('users')
    .update({
      streak: newStreak,
      longest_streak: newLongestStreak,
      last_logged_date: newLogDateObj.toISOString().split('T')[0],
    })
    .eq('id', userId);
} 