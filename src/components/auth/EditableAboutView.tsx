import React, { useState, useRef, useEffect } from 'react';
import { Header } from '../layout/Header';
import { Link } from 'react-router-dom';
import { Plus, Edit3, Save, X, Trash2, GripVertical } from 'lucide-react';

interface ContentBlock {
  id: string;
  type: 'text' | 'heading' | 'list';
  width: 'full' | 'half';
  content: string;
  title?: string;
  listItems?: string[];
  emoji?: string;
}

interface ColumnData {
  left: ContentBlock[];
  right: ContentBlock[];
}

export const EditableAboutView: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingBlock, setEditingBlock] = useState<string | null>(null);
  const [tempContent, setTempContent] = useState('');
  const [tempTitle, setTempTitle] = useState('');
  const [tempEmoji, setTempEmoji] = useState('');
  const [columns, setColumns] = useState<ColumnData>({
    left: [
      {
        id: '1',
        type: 'heading',
        width: 'full',
        title: '📖 About wiSHlist',
        content: 'wiSHlist is a modern, user-friendly wishlist application designed specifically for teachers to create and share classroom supply wishlists with supporters. Built with React, TypeScript, and Appwrite, it empowers educators to create organized wishlists of classroom supplies and materials, making it easy for parents, community members, and supporters to contribute to student success.'
      },
      {
        id: '2',
        type: 'list',
        width: 'half',
        content: '',
        title: '✨ For Teachers',
        listItems: [
          'Wishlist Management: Create and manage multiple wishlists with drag-and-drop reordering',
          'Customizable Items: Add items with names, descriptions, store links, and estimated costs',
          'User Management: Invite and manage recommenders and administrators',
          'Contribution Tracking: Monitor which items have been purchased and by how many contributors',
          'Easy Sharing: Generate shareable links and keys for public wishlist access'
        ]
      }
    ],
    right: [
      {
        id: '3',
        type: 'list',
        width: 'half',
        content: '',
        title: '🛍️ For Supporters',
        listItems: [
          'Easy Browsing: View wishlists in list or grid layout',
          'Item Details: See item descriptions, costs, and store links',
          'Purchase Tracking: Mark items as purchased to prevent duplicates',
          'Direct Links: Quick access to store pages for purchasing',
          'Suggestions: Recommend new items to teachers'
        ]
      }
    ]
  });

  const addNewBlock = (width: 'full' | 'half', type: 'text' | 'heading' | 'list') => {
    const newBlock: ContentBlock = {
      id: Date.now().toString(),
      type,
      width,
      content: type === 'text' ? 'Enter your text here...' : '',
      title: type !== 'text' ? 'New Section' : undefined,
      listItems: type === 'list' ? ['New item'] : undefined,
      emoji: type !== 'text' ? '✨' : undefined
    };

    if (width === 'full') {
      setColumns(prev => ({
        ...prev,
        left: [...prev.left, newBlock]
      }));
    } else {
      // Add to the column with fewer items
      const leftCount = (prev: ColumnData) => prev.left.filter((b: ContentBlock) => b.width === 'half').length;
      const rightCount = (prev: ColumnData) => prev.right.length;
      
      setColumns(prev => {
        if (leftCount(prev) <= rightCount(prev)) {
          return {
            ...prev,
            left: [...prev.left, newBlock]
          };
        } else {
          return {
            ...prev,
            right: [...prev.right, newBlock]
          };
        }
      });
    }

    setEditingBlock(newBlock.id);
    setTempContent(newBlock.content);
    setTempTitle(newBlock.title || '');
    setTempEmoji(newBlock.emoji || '');
  };

  const startEditing = (block: ContentBlock) => {
    setEditingBlock(block.id);
    setTempContent(block.content);
    setTempTitle(block.title || '');
    setTempEmoji(block.emoji || '');
  };

  const saveBlock = () => {
    if (!editingBlock) return;

    setColumns(prev => {
      const updateBlock = (blocks: ContentBlock[]) => 
        blocks.map(block => 
          block.id === editingBlock 
            ? {
                ...block,
                content: tempContent,
                title: tempTitle || block.title,
                emoji: tempEmoji || block.emoji,
                listItems: block.type === 'list' 
                  ? tempContent.split('\n').filter(item => item.trim())
                  : block.listItems
              }
            : block
        );

      return {
        left: updateBlock(prev.left),
        right: updateBlock(prev.right)
      };
    });

    setEditingBlock(null);
    setTempContent('');
    setTempTitle('');
    setTempEmoji('');
  };

  const deleteBlock = (blockId: string) => {
    setColumns(prev => ({
      left: prev.left.filter(block => block.id !== blockId),
      right: prev.right.filter(block => block.id !== blockId)
    }));
  };

  const renderBlock = (block: ContentBlock) => {
    const isBlockEditing = editingBlock === block.id;

    return (
      <div key={block.id} className={`bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 relative group ${
        block.width === 'full' ? 'col-span-2' : ''
      }`}>
        
        {/* Edit Controls */}
        {isEditing && (
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => startEditing(block)}
              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => deleteBlock(block.id)}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {isBlockEditing ? (
          <div className="space-y-3">
            {block.type !== 'text' && (
              <>
                <input
                  type="text"
                  value={tempEmoji}
                  onChange={(e) => setTempEmoji(e.target.value)}
                  className="w-16 px-2 py-1 border rounded text-sm"
                  placeholder="Emoji"
                />
                <input
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded font-semibold"
                  placeholder="Section Title"
                />
              </>
            )}
            
            <textarea
              value={tempContent}
              onChange={(e) => setTempContent(e.target.value)}
              className="w-full px-3 py-2 border rounded resize-none"
              rows={block.type === 'list' ? 8 : 4}
              placeholder={
                block.type === 'list' 
                  ? "Enter list items (one per line)"
                  : "Enter content..."
              }
            />
            
            <div className="flex gap-2">
              <button
                onClick={saveBlock}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                <Save className="w-4 h-4" />
              </button>
              <button
                onClick={() => setEditingBlock(null)}
                className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <>
            {block.type === 'heading' && (
              <>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                  {block.emoji} {block.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">{block.content}</p>
              </>
            )}

            {block.type === 'text' && (
              <p className="text-gray-600 dark:text-gray-400">{block.content}</p>
            )}

            {block.type === 'list' && (
              <>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                  {block.emoji} {block.title}
                </h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                  {block.listItems?.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-sky-600 mr-2">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </div>
    );
  };

  const renderColumn = (blocks: ContentBlock[], isLeftColumn: boolean) => {
    const fullWidthBlocks = isLeftColumn ? blocks.filter(b => b.width === 'full') : [];
    const halfWidthBlocks = blocks.filter(b => b.width === 'half');

    return (
      <>
        {isLeftColumn && fullWidthBlocks.map(renderBlock)}
        {halfWidthBlocks.map(renderBlock)}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900">
      <Header title="About" showSettingsButton={false} showSignoutButton={false} showLoginButton={true} />
      
      {/* Edit Mode Toggle */}
      <div className="max-w-4xl mx-auto px-4 pt-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            About Page Editor
          </h1>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isEditing 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isEditing ? 'Exit Edit Mode' : 'Edit Mode'}
          </button>
        </div>

        {/* Add Content Controls */}
        {isEditing && (
          <div className="mb-6 p-4 bg-white dark:bg-neutral-800 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">Add New Content</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2 text-gray-700 dark:text-gray-300">Full Width</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => addNewBlock('full', 'heading')}
                    className="w-full px-3 py-2 bg-sky-600 text-white rounded hover:bg-sky-700 text-sm"
                  >
                    + Heading Section
                  </button>
                  <button
                    onClick={() => addNewBlock('full', 'text')}
                    className="w-full px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                  >
                    + Text Block
                  </button>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-gray-700 dark:text-gray-300">Half Width</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => addNewBlock('half', 'list')}
                    className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                  >
                    + List Section
                  </button>
                  <button
                    onClick={() => addNewBlock('half', 'text')}
                    className="w-full px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                  >
                    + Text Block
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content Grid */}
        <div className="space-y-6 xl:space-y-0 xl:grid xl:grid-cols-2 xl:gap-6 pb-12">
          {renderColumn(columns.left, true)}
          {renderColumn(columns.right, false)}
        </div>

        {/* Technical Features (Static for now) */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 mt-6">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">🔧 Technical Features</h3>
          <div className="grid sm:grid-cols-2 gap-4 text-gray-600 dark:text-gray-400">
            <div className="flex items-start">
              <span className="text-sky-600 mr-2">🌙</span>
              <span><strong>Dark/Light Mode:</strong> Automatic theme switching</span>
            </div>
            <div className="flex items-start">
              <span className="text-sky-600 mr-2">🔐</span>
              <span><strong>Secure Authentication:</strong> User registration and login with Appwrite</span>
            </div>
            <div className="flex items-start">
              <span className="text-sky-600 mr-2">📦</span>
              <span><strong>Real-time Updates:</strong> Live synchronization of wishlist changes</span>
            </div>
            <div className="flex items-start">
              <span className="text-sky-600 mr-2">🎯</span>
              <span><strong>Modern UI:</strong> Clean, intuitive interface built with Tailwind CSS</span>
            </div>
          </div>
        </div>

        {/* GitHub Link */}
        <div className="text-center mt-6">
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">📚 Need Help Getting Started?</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Visit our complete documentation and installation guide for detailed setup instructions.
            </p>
            <a 
              href="https://github.com/shuff57/wiSHlist" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center bg-sky-600 text-white px-6 py-2 rounded-lg hover:bg-sky-800 transition duration-200 font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              View on GitHub
            </a>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link 
            to="/"
            className="inline-flex items-center bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition duration-200 font-medium"
          >
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};
