import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Truck, Shield, Palette, Sticker, CreditCard, FileImage } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <Navbar />

      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
            Custom Printing
            <span className="text-primary-500"> Made Easy</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            From stickers to business cards, create stunning custom prints with our
            easy-to-use design editor. Premium quality, fast delivery.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/products">
              <Button size="lg" className="text-lg px-8">
                Browse Products
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a href="/api/login">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Sign In to Start
              </Button>
            </a>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="text-center p-6">
            <div className="w-14 h-14 bg-primary-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
              <Palette className="h-7 w-7 text-primary-500" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Easy Design Editor</h3>
            <p className="text-gray-600">Create custom designs with our intuitive online editor</p>
          </div>
          <div className="text-center p-6">
            <div className="w-14 h-14 bg-green-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
              <Sparkles className="h-7 w-7 text-green-500" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Premium Quality</h3>
            <p className="text-gray-600">High-quality materials and vibrant, long-lasting prints</p>
          </div>
          <div className="text-center p-6">
            <div className="w-14 h-14 bg-blue-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
              <Truck className="h-7 w-7 text-blue-500" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Fast Shipping</h3>
            <p className="text-gray-600">Quick turnaround and reliable delivery to your door</p>
          </div>
          <div className="text-center p-6">
            <div className="w-14 h-14 bg-purple-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
              <Shield className="h-7 w-7 text-purple-500" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Satisfaction Guarantee</h3>
            <p className="text-gray-600">100% satisfaction or your money back</p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Popular Products</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <Link href="/products" className="group">
            <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-6 text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-pink-200 to-orange-200 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <Sticker className="h-16 w-16 text-orange-600" />
              </div>
              <h3 className="font-semibold text-lg mb-1">Custom Stickers</h3>
              <p className="text-gray-500">Starting at $4.99</p>
            </div>
          </Link>
          <Link href="/products" className="group">
            <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-6 text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-200 to-purple-200 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <CreditCard className="h-16 w-16 text-purple-600" />
              </div>
              <h3 className="font-semibold text-lg mb-1">Business Cards</h3>
              <p className="text-gray-500">Starting at $19.99</p>
            </div>
          </Link>
          <Link href="/products" className="group">
            <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-6 text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-green-200 to-teal-200 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <FileImage className="h-16 w-16 text-teal-600" />
              </div>
              <h3 className="font-semibold text-lg mb-1">Flyers & Posters</h3>
              <p className="text-gray-500">Starting at $9.99</p>
            </div>
          </Link>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">SB</span>
              </div>
              <span className="font-bold text-xl">Sticky Banditos LLC</span>
            </div>
            <p className="text-gray-400">&copy; {new Date().getFullYear()} Sticky Banditos LLC. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
