import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Moon, Sun, Smartphone, Type, Settings2, Check, Smartphone as Vibrate, LayoutGrid, CheckCircle2 } from 'lucide-react';
import { useSettings, Theme, FontSize, FontType } from '../contexts/SettingsContext';
import { cn } from '../lib/utils';

interface SettingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const themes: { value: Theme; label: string; icon: React.ElementType }[] = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon },
  { value: 'auto', label: 'Auto', icon: Smartphone },
];

const fontSizes: { value: FontSize; label: string }[] = [
  { value: 'small', label: 'P' },
  { value: 'medium', label: 'M' },
  { value: 'large', label: 'G' },
  { value: 'huge', label: 'GG' },
];

const fontTypes: { value: FontType; label: string; description: string }[] = [
  { value: 'inter', label: 'Inter', description: 'Sans-serif moderno' },
  { value: 'mono', label: 'Mono', description: 'Monoespaçada (JetBrains)' },
  { value: 'serif', label: 'Serif', description: 'Editorial (Playfair)' },
  { value: 'classic', label: 'Outfit', description: 'Arredondado técnico' },
];

export default function SettingsSidebar({ isOpen, onClose }: SettingsSidebarProps) {
  const settings = useSettings();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 w-[85%] max-w-sm bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-white/10 z-[160] overflow-y-auto scrollbar-hide flex flex-col theme-transition"
          >
            <div className="p-6 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-sky-400 rounded-xl flex items-center justify-center text-black shadow-lg shadow-sky-400/20">
                  <Settings2 size={24} />
                </div>
                <h2 className="text-xl font-black uppercase tracking-tighter text-zinc-900 dark:text-white">Configurações</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                title="Fechar"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-8 flex-1">
              {/* Theme Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Smartphone size={16} className="text-sky-400" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Tema do App</h3>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {themes.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => {
                        settings.setTheme(t.value);
                        settings.triggerVibration();
                      }}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all",
                        settings.theme === t.value 
                          ? "bg-sky-400/10 border-sky-400 text-sky-400 shadow-sm" 
                          : "bg-zinc-50 dark:bg-zinc-800/30 border-transparent text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      )}
                    >
                      <t.icon size={20} />
                      <span className="text-[10px] font-black uppercase tracking-tight">{t.label}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Vibration Section */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Vibrate size={16} className="text-sky-400" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Vibrar ao tocar</h3>
                  </div>
                  <button
                    onClick={() => {
                      settings.setVibrate(!settings.vibrate);
                      if (!settings.vibrate) settings.triggerVibration(100);
                    }}
                    className={cn(
                      "w-12 h-6 rounded-full p-1 transition-colors relative",
                      settings.vibrate ? "bg-sky-400" : "bg-zinc-200 dark:bg-zinc-800"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded-full bg-white transition-transform shadow-sm",
                      settings.vibrate ? "translate-x-6" : "translate-x-0"
                    )} />
                </button>
                </div>
              </section>

              {/* Font Size Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Type size={16} className="text-sky-400" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Tamanho da Fonte</h3>
                </div>
                <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/30 p-2 rounded-2xl border border-zinc-100 dark:border-white/5 shadow-inner">
                  {fontSizes.map((size) => (
                    <button
                      key={size.value}
                      onClick={() => {
                        settings.setFontSize(size.value);
                        settings.triggerVibration();
                      }}
                      className={cn(
                        "flex-1 py-2 rounded-xl text-xs font-black transition-all",
                        settings.fontSize === size.value 
                          ? "bg-sky-400 text-black shadow-lg" 
                          : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                      )}
                    >
                      {size.label}
                    </button>
                  ))}
                </div>
              </section>

              {/* Font Family Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <LayoutGrid size={16} className="text-sky-400" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Estilo de Tipografia</h3>
                </div>
                <div className="space-y-2">
                  {fontTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => {
                        settings.setFontType(type.value);
                        settings.triggerVibration();
                      }}
                      className={cn(
                        "w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left",
                        settings.fontType === type.value 
                          ? "bg-sky-400/10 border-sky-400 text-sky-400 shadow-sm" 
                          : "bg-zinc-50 dark:bg-zinc-800/30 border-transparent text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      )}
                    >
                      <div>
                        <p className={cn("text-sm font-bold", `font-${type.value}`)}>{type.label}</p>
                        <p className="text-[10px] opacity-60 tracking-tight">{type.description}</p>
                      </div>
                      {settings.fontType === type.value && <CheckCircle2 size={18} />}
                    </button>
                  ))}
                </div>
              </section>
            </div>

            <div className="p-6 border-t border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-black/20 space-y-4">
              <button
                onClick={onClose}
                className="w-full py-4 bg-sky-400 text-black font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-sky-400/20 active:scale-95 transition-all text-xs"
              >
                Salvar Alterações
              </button>
              <div className="flex flex-col items-center">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 dark:text-zinc-700 mb-2 transition-colors">LiveChord Pro</div>
                <div className="text-[8px] text-zinc-400 dark:text-zinc-500">Versão 2.4.0 • Built with AI</div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
