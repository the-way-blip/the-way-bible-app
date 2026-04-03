import { useLocation } from "react-router-dom";

export default function PageTransition({ children }) {
  const location = useLocation();

  return (
    <div className="page-transition page-transition-enter" key={location.key}>
      {children}
    </div>
  );
}
