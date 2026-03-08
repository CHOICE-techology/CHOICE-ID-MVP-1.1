import React from 'react';
import {
  Globe, Shield, Landmark, Coins, Palette,
  Scale, Lock, Zap, Target
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  'web3-101': Globe,
  'sec-201': Shield,
  'collab-301': Landmark,
  'defi-101': Coins,
  'nft-102': Palette,
  'gov-202': Scale,
  'privacy-203': Lock,
  'scale-302': Zap,
  'tokenomics-303': Target,
};

interface CourseIconProps {
  courseId: string;
  size?: number;
  className?: string;
}

const CourseIcon: React.FC<CourseIconProps> = ({ courseId, size = 20, className = '' }) => {
  const IconComponent = ICON_MAP[courseId] || Globe;
  return <IconComponent size={size} className={className} />;
};

export default CourseIcon;
