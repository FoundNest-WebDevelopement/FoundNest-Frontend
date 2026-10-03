// Mobile browsers open the native camera app directly for
// <input type="file" capture="environment">. Desktop browsers ignore that
// hint and just show the file picker, so desktop needs its own in-page
// webcam capture flow instead.
export function isMobileDevice() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile|Windows Phone/i.test(navigator.userAgent);
}
