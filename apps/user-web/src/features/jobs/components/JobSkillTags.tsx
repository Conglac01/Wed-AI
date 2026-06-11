interface JobSkillTagsProps {
  skills: string[] | null;
  max?: number;
}

export function JobSkillTags({ skills, max = 5 }: JobSkillTagsProps) {
  if (!skills || skills.length === 0) return null;

  const visible = skills.slice(0, max);
  const overflow = skills.length - visible.length;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {visible.map((skill) => (
        <span
          key={skill}
          className="inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700"
        >
          {skill}
        </span>
      ))}
      {overflow > 0 && (
        <span className="inline-block rounded-full bg-gray-50 px-2.5 py-0.5 text-xs text-gray-400">
          +{overflow}
        </span>
      )}
    </div>
  );
}
