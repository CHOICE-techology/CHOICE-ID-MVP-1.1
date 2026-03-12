import React, { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Save, User, Cake, Star, Film, UtensilsCrossed, Wine, Heart, Gamepad2 } from 'lucide-react';
import { ChoiceButton } from '@/components/ChoiceButton';

const ProfileSettingsPage: React.FC = () => {
  const { userIdentity: identity, updateIdentity } = useWallet();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(identity?.displayName || '');
  const [bio, setBio] = useState(identity?.bio || '');
  const [birthday, setBirthday] = useState('');
  const [horoscope, setHoroscope] = useState('');
  const [hobbies, setHobbies] = useState('');
  const [favoriteMovie, setFavoriteMovie] = useState('');
  const [favoriteFood, setFavoriteFood] = useState('');
  const [favoriteDrink, setFavoriteDrink] = useState('');

  if (!identity) {
    navigate('/');
    return null;
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        updateIdentity({ ...identity, avatar: ev.target?.result as string });
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSave = () => {
    updateIdentity({
      ...identity,
      displayName: displayName || identity.displayName,
      bio: bio || identity.bio,
    });
    navigate('/identity');
  };

  const fields = [
    { icon: <Cake size={16} />, label: 'Birthday', value: birthday, onChange: setBirthday, placeholder: 'e.g. March 15', type: 'text' },
    { icon: <Star size={16} />, label: 'Horoscope', value: horoscope, onChange: setHoroscope, placeholder: 'e.g. Pisces ♓' },
    { icon: <Gamepad2 size={16} />, label: 'Hobbies', value: hobbies, onChange: setHobbies, placeholder: 'e.g. Chess, Hiking, Coding' },
    { icon: <Film size={16} />, label: 'Favorite Movie', value: favoriteMovie, onChange: setFavoriteMovie, placeholder: 'e.g. Interstellar' },
    { icon: <UtensilsCrossed size={16} />, label: 'Favorite Food', value: favoriteFood, onChange: setFavoriteFood, placeholder: 'e.g. Sushi' },
    { icon: <Wine size={16} />, label: 'Favorite Drink', value: favoriteDrink, onChange: setFavoriteDrink, placeholder: 'e.g. Matcha Latte' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/identity')} className="p-2 rounded-xl bg-muted border border-border hover:bg-accent transition-colors">
          <ArrowLeft size={20} className="text-foreground" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Profile Settings</h1>
          <p className="text-sm text-muted-foreground">Enrich your identity with personal details</p>
        </div>
      </div>

      {/* Avatar */}
      <div className="bg-card border border-border rounded-3xl p-8 shadow-xl flex flex-col items-center">
        <div className="relative group mb-6">
          <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-background shadow-xl bg-muted flex items-center justify-center">
            {identity.avatar ? (
              <img src={identity.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={48} className="text-muted-foreground/30" />
            )}
            <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer rounded-full backdrop-blur-sm">
              <Camera size={28} />
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </label>
          </div>
        </div>

        {/* Name & Bio */}
        <div className="w-full space-y-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:border-primary/40 transition-colors"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:border-primary/40 transition-colors resize-none h-24"
              placeholder="Tell the world about yourself..."
            />
          </div>
        </div>
      </div>

      {/* Personal Details */}
      <div className="bg-card border border-border rounded-3xl p-8 shadow-xl">
        <h3 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2">
          <Heart size={18} className="text-primary" /> Personal Details
        </h3>
        <p className="text-xs text-muted-foreground mb-6">Optional — make your identity feel more human.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map((field) => (
            <div key={field.label}>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <span className="text-primary">{field.icon}</span> {field.label}
              </label>
              <input
                type={field.type || 'text'}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                placeholder={field.placeholder}
                className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-foreground text-sm outline-none focus:border-primary/40 transition-colors"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end gap-3">
        <ChoiceButton variant="outline" onClick={() => navigate('/')}>Cancel</ChoiceButton>
        <ChoiceButton onClick={handleSave}>
          <Save size={16} className="mr-2" /> Save Profile
        </ChoiceButton>
      </div>
    </div>
  );
};

export default ProfileSettingsPage;
