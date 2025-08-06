import React from 'react';
import { UserPlus, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const Register = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        className="text-center py-16"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.div
          className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-br from-orange-500 to-red-500 mb-8"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <UserPlus className="h-12 w-12 text-white" />
        </motion.div>
        
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Kayıt Ol
        </h1>
        
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          Kullanıcı kayıt sistemi yakında aktif olacak
        </p>
        
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl p-8">
          <Zap className="w-12 h-12 text-orange-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Phase 3'te Geliyor
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Üyelik sistemi ile kişiselleştirilmiş deneyim yaşayabileceksiniz.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;