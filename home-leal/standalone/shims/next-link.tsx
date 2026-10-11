import type { AnchorHTMLAttributes } from "react";
import { navigate } from "./router";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

export default function Link({ href, onClick, children, ...rest }: Props) {
  return (
    <a
      {...rest}
      href="#"
      onClick={(e) => {
        e.preventDefault();
        onClick?.(e);
        navigate(href);
      }}
    >
      {children}
    </a>
  );
}
