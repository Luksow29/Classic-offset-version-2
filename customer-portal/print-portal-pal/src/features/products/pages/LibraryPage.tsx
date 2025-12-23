import ProductLibrary from "@/features/products/components/Library";
import { motion } from "framer-motion";
import { Palette, Sparkles, Grid3X3 } from "lucide-react";

export default function ProductLibraryPage() {
    return (
        <div className="space-y-4 md:space-y-6">
            {/* Hero Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="relative overflow-hidden rounded-xl md:rounded-2xl p-4 md:p-8"
            >
                {/* Background Image */}
                <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url('/login-bg.png')` }}
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/90 via-pink-600/85 to-rose-600/90" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-6">
                    <div className="flex items-center gap-3 md:gap-4">
                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="h-10 w-10 md:h-14 md:w-14 rounded-xl md:rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20"
                        >
                            <Palette className="h-5 w-5 md:h-7 md:w-7 text-white" />
                        </motion.div>
                        <div>
                            <motion.h1 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-lg md:text-3xl font-bold text-white"
                            >
                                Design Library
                            </motion.h1>
                            <motion.p 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-pink-100 text-xs md:text-base"
                            >
                                Browse our collection of templates and designs
                            </motion.p>
                        </div>
                    </div>
                    
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="hidden md:flex items-center gap-3"
                    >
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                            <Sparkles className="h-4 w-4 text-yellow-300" />
                            <span className="text-sm font-medium text-white">Premium Templates</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                            <Grid3X3 className="h-4 w-4 text-white" />
                            <span className="text-sm font-medium text-white">All Categories</span>
                        </div>
                    </motion.div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white/5 blur-2xl hidden md:block" />
                <div className="absolute -top-10 -left-10 h-32 w-32 rounded-full bg-pink-500/20 blur-2xl hidden md:block" />
            </motion.div>

            {/* Products Grid */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <ProductLibrary />
            </motion.div>
        </div>
    );
}
