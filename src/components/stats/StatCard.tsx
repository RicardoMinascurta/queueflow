interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  description: string;
}

export default function StatCard({ title, value, icon, description }: StatCardProps) {
  return (
    <div className="bg-white/70 backdrop-blur-sm shadow-lg rounded-xl p-6 border border-blue-100">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
          {icon}
        </div>
        <div>
          <p className="text-gray-600 text-sm">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
    </div>
  );
} 