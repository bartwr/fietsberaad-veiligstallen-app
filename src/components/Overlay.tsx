import React, { useCallback, useEffect, useRef } from "react";

// Import components
import AppHeaderMobile from "~/components/AppHeaderMobile";

interface OverlayProps {
  onClose?: () => void;
  children: React.ReactNode;
  title?: string;
}

/*
  Overlay component
  If onClose param is given:
  - Fullscreen
  - Close button is shown
  If onClose param is _not_ given:
  - Overlay starts below AppHeader
  - Close button isn't shown
*/
const Overlay: React.FC<OverlayProps> = ({
  onClose,
  children,
  title,
}) => {
  const overlayWrapperRef = useRef<HTMLDivElement>(null);

  const backDropHandler = useCallback(
    (e: MouseEvent) => {
      if (
        overlayWrapperRef.current &&
        !overlayWrapperRef.current.contains(e.target as Node)
      ) {
        if (onClose) onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      window.addEventListener("click", backDropHandler);
    });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("click", backDropHandler);
    };
  }, [backDropHandler]);

  const handleCloseClick = (
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>
  ) => {
    e.preventDefault();
    if (onClose) onClose();
  };

  const overlayContent = (
    <div className={`
      z-20 fixed w-full overflow-auto
      ${onClose ? 'top-0' : 'top-20'}
    `}
      style={{
        height: onClose ? '100%' : 'calc(100% - 80px)' // topbar with logo and search = 80px
      }}
    >
      <div className="bg-white min-h-full">
        <div ref={overlayWrapperRef} className="overlay-wrapper min-h-full">
          <div className="overlay min-h-full">
            {onClose ? <AppHeaderMobile
              title={title}
              handleCloseClick={handleCloseClick}
            /> : ''}
            <div className="overlay-body px-6 min-h-full">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return overlayContent;
};

export default Overlay;
