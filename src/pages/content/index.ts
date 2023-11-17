/**
 * DO NOT USE import someModule from '...';
 *
 * @issue-url https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite/issues/160
 *
 * Chrome extensions don't support modules in content scripts.
 * If you want to use other modules in content scripts, you need to import them via these files.
 *
 */
import('@pages/content/ui');
import('@pages/content/injected');

console.log('content loaded');

// Add an event listener to the document for any change events
document.addEventListener('change', (e: Event) => {
  // Ensure the target of the event is an HTMLInputElement
  const target = e.target as HTMLInputElement;

  // Check if the target is a file input
  if (target && target.type === 'file') {
    const files = target.files;

    if (files) {
      // Iterate over the FileList
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Check if the file type includes 'video'
        if (file.type.includes('video')) {
          console.log('Video file detected:', file.name);
          // Perform further actions here
        }
      }
    }
  }
});
