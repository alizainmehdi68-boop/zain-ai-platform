/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext.js';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Header } from './components/Header.js';
import { Footer } from './components/Footer.js';
import { HomePage } from './pages/HomePage.js';
import { ToolsPage } from './pages/ToolsPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { AdminPage } from './pages/AdminPage.js';
import { HistoryPage } from './pages/HistoryPage.js';
import { PricingSection } from './components/PricingSection.js';
import { ToolRunnerModal } from './components/ToolRunnerModal.js';
import { CheckoutModal } from './components/CheckoutModal.js';
import { AuthModal } from './components/AuthModal.js';
import { LegalPage } from './pages/LegalPage.js';
import { AITool } from './types/index.js';

function MainApp() {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [activeTool, setActiveTool] = useState<AITool | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<'pro' | 'business'>('pro');
  const [legalModalPage, setLegalModalPage] = useState<string | null>(null);

  const openCheckout = (planSlug: 'pro' | 'business' = 'pro') => {
    setCheckoutPlan(planSlug);
    setCheckoutOpen(true);
  };

  const openToolRunner = (tool: AITool) => {
    setActiveTool(tool);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Sticky Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        openCheckout={openCheckout}
      />

      {/* Main View Container */}
      <main className="flex-1">
        {currentTab === 'home' && (
          <HomePage
            setCurrentTab={setCurrentTab}
            openToolRunner={openToolRunner}
            openCheckout={openCheckout}
          />
        )}

        {currentTab === 'tools' && (
          <ToolsPage
            openToolRunner={openToolRunner}
            openCheckout={openCheckout}
          />
        )}

        {currentTab === 'pricing' && (
          <div className="py-8">
            <PricingSection openCheckout={openCheckout} />
          </div>
        )}

        {currentTab === 'dashboard' && (
          <DashboardPage
            openToolRunner={openToolRunner}
            openCheckout={openCheckout}
          />
        )}

        {currentTab === 'history' && <HistoryPage />}

        {currentTab === 'admin' && <AdminPage />}
      </main>

      {/* Footer */}
      <Footer
        setCurrentTab={setCurrentTab}
        openLegalModal={(page) => setLegalModalPage(page)}
      />

      {/* Modals */}
      {activeTool && (
        <ToolRunnerModal
          tool={activeTool}
          onClose={() => setActiveTool(null)}
          openCheckout={openCheckout}
        />
      )}

      {checkoutOpen && (
        <CheckoutModal
          initialPlanSlug={checkoutPlan}
          onClose={() => setCheckoutOpen(false)}
          onSuccess={() => {
            setCheckoutOpen(false);
            setCurrentTab('dashboard');
          }}
        />
      )}

      <AuthModal />

      {legalModalPage && (
        <LegalPage
          page={legalModalPage}
          onClose={() => setLegalModalPage(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
