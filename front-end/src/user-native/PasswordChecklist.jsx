import Icon from "./Icon";
import { PASSWORD_RULES } from "../utils/passwordRules";

// Live password rules under the "New Password" field (PasswordChecklist of the native app, light variant)
export default function PasswordChecklist({ password }) {
  if (!password || PASSWORD_RULES.every((rule) => rule.test(password))) return null;

  return (
    <div className="mt-2 flex flex-col gap-1 pl-1">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(password);
        // nothing typed yet: neutral hints instead of red "failed" marks
        const pristine = password.length === 0;
        const color = pristine ? "#8C7A70" : met ? "#2E7D32" : "#C0392B";
        return (
          <div key={rule.key} className="flex items-center gap-1.5">
            <Icon name={pristine ? "ellipse-outline" : met ? "checkmark-circle" : "close-circle"} size={16} color={color} />
            <span className="text-[13px]" style={{ color }}>
              {rule.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
