export type Topic = {
  id: number; title: string; category: string; initials: string; author: string;
  color: string; time: string; replies: number; unread?: number; solved?: boolean;
  attachment?: boolean; following?: boolean; body: string; response?: string;
};

export const initialTopics: Topic[] = [
  { id: 1, title: 'Wi-Fi disappears after waking my laptop', category: 'Help and support', initials: 'JD', author: 'Jamie D.', color: 'blue', time: '8 min', replies: 8, unread: 3, following: true,
    body: 'My laptop connects normally after a restart, but Wi-Fi sometimes disappears when I open the lid. I’m on Windows 11 and everything else seems fine. Has anyone found a reliable fix?',
    response: 'I had something similar. Before changing settings, I’d check the adapter model and driver version in Device Manager, then compare them with the laptop maker’s support page. Did this start after an update?' },
  { id: 2, title: 'Which backup setup do you trust?', category: 'Software', initials: 'MK', author: 'Morgan K.', color: 'purple', time: '24 min', replies: 16, unread: 2, following: true,
    body: 'I’m rethinking how I back up my home PC. I’d love a setup that is easy to check and easy to restore. What has worked well for you?',
    response: 'My best habit has been testing a restore. I keep a local copy and a separate off-site copy, and I check a few restored files every month.' },
  { id: 3, title: 'Show us your Windows desktop', category: 'Customization', initials: 'SL', author: 'Sam L.', color: 'green', time: '2 h', replies: 12, following: true,
    body: 'A little desktop inspiration for the week. Are you keeping things minimal, or making room for all your favorite tools? Tell us about your setup.',
    response: 'A clean taskbar and a few carefully chosen shortcuts. I’ve finally stopped using my desktop as a downloads folder!' },
  { id: 4, title: 'A small PowerToys feature I use every day', category: 'Tips and Tutorials', initials: 'PR', author: 'Priya R.', color: 'orange', time: '5 h', replies: 7, solved: true,
    body: 'PowerToys Run has become my quickest way to find an app or jump to a folder. Which small Windows tool has made the biggest difference to your day?',
    response: 'FancyZones for me. Having a consistent window layout makes moving between projects much easier.' },
  { id: 5, title: 'USB-C dock works on one laptop only', category: 'Hardware and Drivers', initials: 'TM', author: 'Taylor M.', color: 'pink', time: '1 d', replies: 4, attachment: true,
    body: 'The same dock and cable work with my work laptop, but my personal laptop only sees the USB devices. The external display stays blank. What should I compare first?',
    response: 'Start with the specifications of the USB-C port on each laptop. Not every USB-C port supports video output. The laptop and dock model numbers will help narrow it down.' },
];

export const forums = [
  { name: 'Help and support', description: 'Work through it together.', color: 'blue', count: 'Windows questions', icon: 'help' },
  { name: 'Software', description: 'Apps, updates, and everyday tools.', color: 'purple', count: 'Discover and discuss', icon: 'apps' },
  { name: 'Customization', description: 'Make Windows feel like yours.', color: 'green', count: 'Setups and inspiration', icon: 'desktop' },
  { name: 'Tips and Tutorials', description: 'A better way to get things done.', color: 'orange', count: 'Community know-how', icon: 'light' },
  { name: 'Hardware and Drivers', description: 'Builds, devices, and troubleshooting.', color: 'pink', count: 'Find your next fix', icon: 'hardware' },
];

export const sampleAlerts = [
  { id: 1, topic: 1, initials: 'MK', color: 'purple', author: 'Morgan K.', action: 'replied to your discussion', title: 'Wi-Fi disappears after waking my laptop', time: '8 min ago' },
  { id: 2, topic: 2, initials: 'JD', color: 'blue', author: 'Jamie D.', action: 'mentioned you in', title: 'Which backup setup do you trust?', time: '24 min ago' },
  { id: 3, topic: 3, initials: 'SL', color: 'green', author: 'Sam L.', action: 'added a reply to', title: 'Show us your Windows desktop', time: '2 hours ago' },
];
