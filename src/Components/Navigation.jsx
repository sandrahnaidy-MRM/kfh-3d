"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import DownIcon from "@assets/media/icons/teenyicons_down-solid.svg";
import MobileIcon from "@assets/media/icons/tdesign_mobile.svg";
import SearchIcon from "@assets/media/icons/mynaui_search.svg";
import UserIcon from "@assets/media/icons/tdesign_user.svg";
import Logo from "@assets/media/icons/KFH Capital Logo.svg";

const Navigation = () => {
  return (
    <motion.div
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        duration: 1.75,
        ease: [0.4, 0, 0.6, 1],
        delay: 0.25,
      }}
      className={clsx(
        "w-full h-44 overflow-hidden flex items-center px-6 md:px-16 z-50 fixed",
      )}
    >
      {/* LEFT + RIGHT CONTENT */}
      <div className="w-full h-36 flex justify-between items-center relative z-10">
        {/* LEFT NAV */}
        <div className="flex gap-10 justify-center items-center">
          {["How we help", "Solutions", "Funds", "Insights", "about us"].map(
            (item) => (
              <div key={item} className="flex items-center gap-3">
                <p className="text-white text-base font-normal font-['Figtree'] uppercase">
                  {item}
                </p>
                <img src={DownIcon} alt="icon-down" className="size-3.5" />
              </div>
            ),
          )}
        </div>

        {/* RIGHT NAV */}
        <div className="flex gap-8 justify-center items-center">
          <p className="text-white text-sm font-normal font-['Figtree'] uppercase">
            Tools
          </p>
          <p className="text-white text-sm font-normal font-['Figtree'] uppercase">
            Contact us
          </p>

          <div className="flex items-center gap-2 p-3 h-10">
            <img src={MobileIcon} className="size-4.5" />
            <p className="text-white text-xs font-normal font-['Figtree'] uppercase">
              download app
            </p>
          </div>

          <div className="size-10 flex justify-center items-center">
            <p className="text-white text-base font-bold font-['Figtree'] uppercase">
              ع
            </p>
          </div>

          <div className="size-10 flex justify-center items-center">
            <img src={SearchIcon} className="size-6" />
          </div>

          <div className="size-10 flex justify-center items-center">
            <img src={UserIcon} className="size-6" />
          </div>
        </div>
      </div>

      {/* 🔥 PERFECTLY CENTERED LOGO */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
        <img src={Logo} alt="logo" className="w-32 h-10 object-contain" />
      </div>
    </motion.div>
  );
};

export default Navigation;
