import './App.css'
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar.jsx';
import Footer from './components/layout/Footer.jsx';
import Landing from './components/landing/Landing.jsx';
import Guide from './components/landing/Guide.jsx';
import { PageLayout } from './components/layout/PageLayout.jsx';
import GerberSidebar from './components/gerber/GerberSidebar.jsx';
import OutputPanel from './components/gerber/OutputPanel.jsx';
import MainView from './components/gerber/MainViewer.jsx';
import { GerberProvider } from './components/context/GerberContext.jsx';
import { AppProvider } from './components/context/AppContext.jsx';

function App() {
  return (
    <>
      <AppProvider>
        <div className="h-screen flex flex-col bg-paper text-ink transition-colors dark:bg-ink dark:text-white">

          <GerberProvider>
            
              <Router>
                <Navbar />

                <Routes>
                  <Route path='/' element={<Landing />} />
                  <Route path='/guide' element={<Guide />} />
                  <Route 
                    path='/gerber' 
                    element={
                      <>
                        <PageLayout
                          sidebar={<GerberSidebar />}
                          main={<MainView />}
                          right={<OutputPanel />}
                        />
                        <Footer />
                      </>
                    }
                  />
                </Routes>
              </Router>
          </GerberProvider>
        </div>
      </AppProvider>
    </>
  )
}

export default App
