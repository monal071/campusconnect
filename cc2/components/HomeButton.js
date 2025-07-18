import Link from 'next/link';
import HomeIcon from '@mui/icons-material/Home';

export default function HomeButton() {
  return (
    <Link
      href="/"
      className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors cursor-pointer"
    >
      <HomeIcon className="w-6 h-6" />
    </Link>
  );
} 