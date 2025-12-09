import React from "react";

const ClientLayout = ({ children }) => {
  return (
    <div>
      <main className="min-h-screen">{children}</main>
    </div>
  );
};

export default ClientLayout;
