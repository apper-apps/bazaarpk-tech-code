import React from "react";
import { cn } from "@/utils/cn";

const Card = React.forwardRef(({ 
  className, 
  children, 
  hover = false,
  ...props 
}, ref) => {
  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-gray-100 shadow-soft",
        hover && "transition-all duration-300 hover:shadow-large hover:scale-[1.02] hover:-translate-y-1",
        className
      )}
      ref={ref}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = "Card";
export default Card;