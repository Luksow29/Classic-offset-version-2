import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Card from '../../ui/Card';
import { Users, Package, Warehouse, Banknote, TrendingDown, Wrench, UserCog, ShoppingCart, Boxes, CreditCard, Receipt, Layers } from 'lucide-react';

const OtherLinksTab: React.FC = () => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
        >
            <section className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Other Admin Links</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Link to Users Management */}
                    <Link to="/users" className="block">
                        <Card className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <Users className="w-6 h-6 text-blue-600" />
                                <div>
                                    <h3 className="font-semibold text-foreground">User Management</h3>
                                    <p className="text-sm text-muted-foreground">Manage user accounts & roles.</p>
                                </div>
                            </div>
                            <UserCog className="w-5 h-5 text-muted-foreground" />
                        </Card>
                    </Link>

                    {/* Link to Product Master */}
                    <Link to="/products" className="block">
                        <Card className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <Package className="w-6 h-6 text-purple-600" />
                                <div>
                                    <h3 className="font-semibold text-foreground">Product Master</h3>
                                    <p className="text-sm text-muted-foreground">Manage products/services.</p>
                                </div>
                            </div>
                            <ShoppingCart className="w-5 h-5 text-muted-foreground" />
                        </Card>
                    </Link>

                    {/* Link to Stock Management */}
                    <Link to="/stock" className="block">
                        <Card className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <Warehouse className="w-6 h-6 text-orange-600" />
                                <div>
                                    <h3 className="font-semibold text-foreground">Stock Management</h3>
                                    <p className="text-sm text-muted-foreground">Track inventory levels.</p>
                                </div>
                            </div>
                            <Boxes className="w-5 h-5 text-muted-foreground" />
                        </Card>
                    </Link>

                    {/* Link to Due Summary */}
                    <Link to="/due-summary" className="block">
                        <Card className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <Banknote className="w-6 h-6 text-red-600" />
                                <div>
                                    <h3 className="font-semibold text-foreground">Due Summary</h3>
                                    <p className="text-sm text-muted-foreground">View pending payments.</p>
                                </div>
                            </div>
                            <CreditCard className="w-5 h-5 text-muted-foreground" />
                        </Card>
                    </Link>

                    {/* Link to Expenses */}
                    <Link to="/expenses" className="block">
                        <Card className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <TrendingDown className="w-6 h-6 text-purple-600" />
                                <div>
                                    <h3 className="font-semibold text-foreground">Expenses</h3>
                                    <p className="text-sm text-muted-foreground">Manage business expenditures.</p>
                                </div>
                            </div>
                            <Receipt className="w-5 h-5 text-muted-foreground" />
                        </Card>
                    </Link>

                    {/* Link to Materials */}
                    <Link to="/materials" className="block">
                        <Card className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <Wrench className="w-6 h-6 text-cyan-600" />
                                <div>
                                    <h3 className="font-semibold text-foreground">Materials</h3>
                                    <p className="text-sm text-muted-foreground">Manage raw materials.</p>
                                </div>
                            </div>
                            <Layers className="w-5 h-5 text-muted-foreground" />
                        </Card>
                    </Link>
                </div>
            </section>
        </motion.div>
    );
};

export default OtherLinksTab;
