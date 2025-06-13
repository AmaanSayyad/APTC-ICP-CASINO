import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import NFIDConnectButton from "./NFIDConnectButton";
import TokenBalance from "./TokenBalance";
import { useNotification } from "./NotificationSystem";
import { useNFID } from "../providers/NFIDProvider";

// Mock search results for demo purposes
const MOCK_SEARCH_RESULTS = {
  games: [
    { id: "game1", name: "Roulette", path: "/game/roulette", type: "Featured" },
    {
      id: "game2",
      name: "Blackjack",
      path: "/game/blackjack",
      type: "Popular",
    },
    { id: "game3", name: "Poker", path: "/game/poker", type: "New" },
  ],
  tournaments: [
    {
      id: "tournament1",
      name: "High Roller Tournament",
      path: "/tournaments/high-roller",
      prize: "10,000 APTC",
    },
    {
      id: "tournament2",
      name: "Weekend Battle",
      path: "/tournaments/weekend-battle",
      prize: "5,000 APTC",
    },
  ],
  pages: [
    {
      id: "page1",
      name: "Bank",
      path: "/bank",
      description: "Deposit and withdraw funds",
    },
    {
      id: "page2",
      name: "Profile",
      path: "/profile",
      description: "Your account details",
    },
  ],
};

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isConnected, principal } = useNFID();
  const [userAddress, setUserAddress] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const searchInputRef = useRef(null);
  const searchPanelRef = useRef(null);
  const notification = useNotification();
  const isDev = import.meta.env.DEV;

  // Mock notifications for UI purposes
  const [notifications, setNotifications] = useState([
    {
      id: "1",
      title: "Balance Updated",
      message: "Your APTC balance has been updated",
      isRead: false,
      time: "2 min ago",
    },
    {
      id: "2",
      title: "New Tournament",
      message: "High Roller Tournament starts in 1 hour",
      isRead: false,
      time: "1 hour ago",
    },
  ]);

  useEffect(() => {
    setIsClient(true);
    setUnreadNotifications(notifications.filter((n) => !n.isRead).length);

    // Initialize dark mode from local storage if available
    const savedMode = localStorage.getItem("darkMode");
    if (savedMode !== null) {
      setIsDarkMode(savedMode === "true");
    }

    // Update user address from NFID
    if (isConnected && principal) {
      setUserAddress(principal);
    } else {
      setUserAddress(null);
    }

    // Handle click outside search panel
    const handleClickOutside = (event) => {
      if (
        searchPanelRef.current &&
        !searchPanelRef.current.contains(event.target) &&
        !searchInputRef.current?.contains(event.target)
      ) {
        setShowSearch(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDev, notifications, isConnected, principal]);

  // Handle search input
  useEffect(() => {
    if (searchQuery.length > 1) {
      // In a real app, you would call an API here
      // For demo, we'll filter the mock data
      const query = searchQuery.toLowerCase();
      const games = MOCK_SEARCH_RESULTS.games.filter((game) =>
        game.name.toLowerCase().includes(query)
      );
      const tournaments = MOCK_SEARCH_RESULTS.tournaments.filter((tournament) =>
        tournament.name.toLowerCase().includes(query)
      );
      const pages = MOCK_SEARCH_RESULTS.pages.filter(
        (page) =>
          page.name.toLowerCase().includes(query) ||
          (page.description && page.description.toLowerCase().includes(query))
      );

      setSearchResults({ games, tournaments, pages });
    } else {
      setSearchResults(null);
    }
  }, [searchQuery]);

  const navLinks = [
    {
      name: "Home",
      path: "/",
      classes: "text-hover-gradient-home",
    },
    {
      name: "Game",
      path: "/game",
      classes: "text-hover-gradient-game",
    },
    {
      name: "Bank",
      path: "/bank",
      classes: "text-hover-gradient-bank",
    },
  ];

  const handleProfileClick = () => {
    navigate("/profile");
  };

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem("darkMode", newMode.toString());
    // Here you would also apply the theme change to your app
  };

  const markNotificationAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadNotifications((prev) => Math.max(0, prev - 1));
  };

  const clearAllNotifications = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadNotifications(0);
    setShowNotificationsPanel(false);
    notification.success("All notifications marked as read");
  };

  const handleSearchIconClick = () => {
    setShowSearch((prev) => !prev);
    if (!showSearch) {
      // Focus the search input when opening
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  };

  const handleSearchItemClick = (path) => {
    navigate(path);
    setShowSearch(false);
    setSearchQuery("");
  };

  return (
    <nav className="backdrop-blur-md bg-[#070005]/90 fixed w-full z-20 transition-all duration-300 shadow-lg mb-10">
      <div className="flex w-full items-center justify-between py-6 px-4 sm:px-10 md:px-20 lg:px-36">
        <div className="flex items-center">
          <Link to="/" className="logo mr-6">
            <img
              src="/PowerPlay.png"
              alt="powerplay image"
              width={172}
              height={15}
            />
          </Link>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-white p-1 rounded-lg hover:bg-purple-500/20 transition-colors"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            aria-label="Toggle mobile menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              {showMobileMenu ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </>
              ) : (
                <>
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </>
              )}
            </svg>
          </button>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex font-display gap-8 lg:gap-12 items-center">
          {navLinks.map(({ name, path, classes }, index) => (
            <div key={index} className="relative group">
              <Link
                className={`${
                  path === location.pathname
                    ? "text-transparent bg-clip-text bg-gradient-to-r from-red-magic to-blue-magic font-semibold"
                    : classes
                } flex items-center gap-1 text-lg font-medium transition-all duration-200 hover:scale-105`}
                to={path}
              >
                {name}
              </Link>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {/* Search Icon */}
          <div className="relative">
            <button
              className="p-2 text-white/70 hover:text-white transition-colors rounded-full hover:bg-purple-500/20"
              onClick={handleSearchIconClick}
              aria-label="Search"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>

            {/* Search Panel */}
            {showSearch && (
              <div
                className="absolute right-0 mt-2 w-80 md:w-96 bg-[#1A0015]/95 backdrop-blur-md border border-purple-500/30 rounded-lg shadow-xl z-40 animate-fadeIn"
                ref={searchPanelRef}
              >
                <div className="p-3">
                  <div className="relative">
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search games, tournaments..."
                      className="w-full py-2 px-3 pr-10 bg-[#250020] border border-purple-500/20 rounded-md text-white focus:outline-none focus:border-purple-500"
                    />
                    <svg
                      className="absolute right-3 top-2.5 text-white/50"
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                  </div>
                </div>

                {searchQuery.length > 1 && (
                  <div className="max-h-96 overflow-y-auto">
                    {!searchResults ||
                    (searchResults.games.length === 0 &&
                      searchResults.tournaments.length === 0 &&
                      searchResults.pages.length === 0) ? (
                      <div className="p-4 text-center text-white/50">
                        No results found
                      </div>
                    ) : (
                      <>
                        {/* Games */}
                        {searchResults.games.length > 0 && (
                          <div className="p-2">
                            <h3 className="text-xs font-medium text-white/50 uppercase px-3 mb-1">
                              Games
                            </h3>
                            {searchResults.games.map((game) => (
                              <div
                                key={game.id}
                                className="p-2 hover:bg-purple-500/10 rounded-md cursor-pointer mx-1"
                                onClick={() => handleSearchItemClick(game.path)}
                              >
                                <div className="flex items-center">
                                  <div className="w-8 h-8 rounded-md bg-purple-800/30 flex items-center justify-center mr-3">
                                    <span className="text-sm">
                                      {game.name.charAt(0)}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-white">
                                      {game.name}
                                    </p>
                                    <span className="text-xs text-white/50">
                                      {game.type}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Tournaments */}
                        {searchResults.tournaments.length > 0 && (
                          <div className="p-2">
                            <h3 className="text-xs font-medium text-white/50 uppercase px-3 mb-1">
                              Tournaments
                            </h3>
                            {searchResults.tournaments.map((tournament) => (
                              <div
                                key={tournament.id}
                                className="p-2 hover:bg-purple-500/10 rounded-md cursor-pointer mx-1"
                                onClick={() =>
                                  handleSearchItemClick(tournament.path)
                                }
                              >
                                <div className="flex items-center">
                                  <div className="w-8 h-8 rounded-md bg-red-800/30 flex items-center justify-center mr-3">
                                    <span className="text-sm">🏆</span>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-white">
                                      {tournament.name}
                                    </p>
                                    <span className="text-xs text-white/50">
                                      Prize: {tournament.prize}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Pages */}
                        {searchResults.pages.length > 0 && (
                          <div className="p-2">
                            <h3 className="text-xs font-medium text-white/50 uppercase px-3 mb-1">
                              Pages
                            </h3>
                            {searchResults.pages.map((page) => (
                              <div
                                key={page.id}
                                className="p-2 hover:bg-purple-500/10 rounded-md cursor-pointer mx-1"
                                onClick={() => handleSearchItemClick(page.path)}
                              >
                                <div className="flex items-center">
                                  <div className="w-8 h-8 rounded-md bg-blue-800/30 flex items-center justify-center mr-3">
                                    <span className="text-sm">
                                      {page.name.charAt(0)}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-white">
                                      {page.name}
                                    </p>
                                    {page.description && (
                                      <span className="text-xs text-white/50">
                                        {page.description}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {searchQuery.length > 0 && (
                  <div className="p-2 border-t border-purple-500/20 text-center">
                    <span className="text-xs text-white/50">
                      Press Enter to search for "{searchQuery}"
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 text-white/70 hover:text-white transition-colors hidden md:block rounded-full hover:bg-purple-500/20"
            aria-label={
              isDarkMode ? "Switch to light mode" : "Switch to dark mode"
            }
          >
            {isDarkMode ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="4"></circle>
                <path d="M12 2v2"></path>
                <path d="M12 20v2"></path>
                <path d="M5 5l1.5 1.5"></path>
                <path d="M17.5 17.5l1.5 1.5"></path>
                <path d="M2 12h2"></path>
                <path d="M20 12h2"></path>
                <path d="M5 19l1.5-1.5"></path>
                <path d="M17.5 6.5l1.5-1.5"></path>
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            )}
          </button>

          {/* Notifications */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setShowNotificationsPanel(!showNotificationsPanel)}
              className="p-2 text-white/70 hover:text-white transition-colors relative rounded-full hover:bg-purple-500/20"
              aria-label="Notifications"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              {unreadNotifications > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold">
                  {unreadNotifications}
                </span>
              )}
            </button>

            {/* Notifications Panel */}
            {showNotificationsPanel && (
              <div className="absolute right-0 mt-2 w-80 bg-[#1A0015]/95 backdrop-blur-md border border-purple-500/30 rounded-lg shadow-xl z-30 animate-fadeIn">
                <div className="p-3 border-b border-purple-500/20 flex justify-between items-center">
                  <h3 className="font-medium text-white">Notifications</h3>
                  <button
                    onClick={clearAllNotifications}
                    className="text-xs text-white/50 hover:text-white"
                  >
                    Mark all as read
                  </button>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-white/50">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 border-b border-purple-500/10 hover:bg-purple-500/5 cursor-pointer ${
                          !notification.isRead ? "bg-purple-900/10" : ""
                        }`}
                        onClick={() => markNotificationAsRead(notification.id)}
                      >
                        <div className="flex justify-between">
                          <h4 className="font-medium text-white text-sm">
                            {notification.title}
                          </h4>
                          <span className="text-xs text-white/40">
                            {notification.time}
                          </span>
                        </div>
                        <p className="text-xs text-white/70 mt-1">
                          {notification.message}
                        </p>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-red-500 rounded-full absolute top-3 right-3"></div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2 border-t border-purple-500/20 text-center">
                  <a
                    href="/notifications"
                    className="text-xs text-white/70 hover:text-white"
                  >
                    View all notifications
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Token Balance */}
          {isClient && !isDev && <TokenBalance />}

          {/* Wallet Button */}
          <NFIDConnectButton />
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {showMobileMenu && (
        <div className="md:hidden bg-[#0A0008]/95 backdrop-blur-md p-4 border-t border-purple-500/20 animate-slideDown">
          <div className="flex flex-col space-y-3">
            {navLinks.map(({ name, path, classes }, index) => (
              <div key={index}>
                <Link
                  className={`${
                    path === location.pathname
                      ? "text-transparent bg-clip-text bg-gradient-to-r from-red-magic to-blue-magic font-semibold"
                      : classes
                  } py-2 px-3 rounded-md hover:bg-purple-500/10 flex items-center w-full text-lg font-medium`}
                  href={path}
                  onClick={() => setShowMobileMenu(false)}
                >
                  {name}
                </Link>
              </div>
            ))}
            <div className="flex justify-between items-center py-2 px-3">
              <span className="text-white/70">Dark Mode</span>
              <button
                onClick={toggleDarkMode}
                className="p-2 text-white/70 hover:text-white bg-purple-500/10 rounded-full flex items-center justify-center h-8 w-8"
              >
                {isDarkMode ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="4"></circle>
                    <path d="M12 2v2"></path>
                    <path d="M12 20v2"></path>
                    <path d="M5 5l1.5 1.5"></path>
                    <path d="M17.5 17.5l1.5 1.5"></path>
                    <path d="M2 12h2"></path>
                    <path d="M20 12h2"></path>
                    <path d="M5 19l1.5-1.5"></path>
                    <path d="M17.5 6.5l1.5-1.5"></path>
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  </svg>
                )}
              </button>
            </div>

            <div className="pt-2 mt-2 border-t border-purple-500/10">
              <a
                href="#support"
                className="block py-2 px-3 text-white/80 hover:text-white hover:bg-purple-500/10 rounded-md"
                onClick={() => setShowMobileMenu(false)}
              >
                Support
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="w-full h-[2px] magic-gradient overflow-hidden"></div>
    </nav>
  );
}
