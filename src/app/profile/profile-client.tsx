// Desktop /profile reuses the mobile component — same dark zinc design works
// on wider screens, and we avoid duplicating the resume + portfolio + summary
// management logic. Wrap in a max-width container in page.tsx.
export { ProfileClient } from '@/app/(mobile)/app/profile/profile-client'
