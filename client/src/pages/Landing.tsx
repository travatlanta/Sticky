import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Truck, Shield, Palette, Sticker, CreditCard, FileImage, Star } from "lucide-react";

export default function Landing() {
  return (
    <>
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-100 via-yellow-50 to-orange-50 -z-10" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-yellow-300/30 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-orange-300/20 rounded-full blur-3xl -z-10" />
        
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-orange-200 rounded-full px-4 py-2 mb-6">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700">Premium Quality Printing</span>
            </div>
            
            <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl text-gray-900 mb-6 leading-tight">
              Custom Printing
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-orange-600 to-red-500">
                Made Easy
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-2xl mx-auto">
              From stickers to business cards, create stunning custom prints with our
              easy-to-use design editor. Premium quality, fast delivery.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/products">
                <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/30">
                  Browse Products
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="/api/login">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2 border-orange-300 hover:bg-orange-50">
                  Sign In to Start
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-100">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-orange-500/30">
                <Palette className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-heading text-xl mb-2 text-gray-900">Easy Design Editor</h3>
              <p className="text-gray-600">Create custom designs with our intuitive online editor</p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
              <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-green-500/30">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-heading text-xl mb-2 text-gray-900">Premium Quality</h3>
              <p className="text-gray-600">High-quality materials and vibrant, long-lasting prints</p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Truck className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-heading text-xl mb-2 text-gray-900">Fast Shipping</h3>
              <p className="text-gray-600">Quick turnaround and reliable delivery to your door</p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-violet-500 rounded-xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-heading text-xl mb-2 text-gray-900">Satisfaction Guarantee</h3>
              <p className="text-gray-600">100% satisfaction or your money back</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-orange-50 via-yellow-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-heading text-4xl md:text-5xl text-gray-900 mb-4">Popular Products</h2>
            <p className="text-lg text-gray-600">Start creating with our most loved print products</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Link href="/products" className="group">
              <div className="bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 text-center border border-orange-100 group-hover:-translate-y-2">
                <div className="w-32 h-32 bg-gradient-to-br from-pink-300 via-orange-300 to-yellow-300 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg">
                  <Sticker className="h-16 w-16 text-white drop-shadow-md" />
                </div>
                <h3 className="font-heading text-2xl mb-2 text-gray-900">Custom Stickers</h3>
                <p className="text-gray-500 mb-4">Die-cut, kiss-cut, and sheet stickers</p>
                <p className="text-orange-500 font-bold text-lg">Starting at $4.99</p>
              </div>
            </Link>
            <Link href="/products" className="group">
              <div className="bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 text-center border border-blue-100 group-hover:-translate-y-2">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-300 via-indigo-300 to-purple-300 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg">
                  <CreditCard className="h-16 w-16 text-white drop-shadow-md" />
                </div>
                <h3 className="font-heading text-2xl mb-2 text-gray-900">Business Cards</h3>
                <p className="text-gray-500 mb-4">Premium cardstock with custom finishes</p>
                <p className="text-orange-500 font-bold text-lg">Starting at $19.99</p>
              </div>
            </Link>
            <Link href="/products" className="group">
              <div className="bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 text-center border border-green-100 group-hover:-translate-y-2">
                <div className="w-32 h-32 bg-gradient-to-br from-green-300 via-teal-300 to-cyan-300 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg">
                  <FileImage className="h-16 w-16 text-white drop-shadow-md" />
                </div>
                <h3 className="font-heading text-2xl mb-2 text-gray-900">Flyers & Posters</h3>
                <p className="text-gray-500 mb-4">Eye-catching prints in any size</p>
                <p className="text-orange-500 font-bold text-lg">Starting at $9.99</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 rounded-3xl p-12 text-center text-white shadow-xl">
            <div className="flex justify-center gap-1 mb-4">
              {[1,2,3,4,5].map((i) => (
                <Star key={i} className="h-6 w-6 fill-yellow-300 text-yellow-300" />
              ))}
            </div>
            <h2 className="font-heading text-3xl md:text-4xl mb-4">Trusted by Thousands of Happy Customers</h2>
            <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
              Join our community of creators and businesses who trust Sticky Banditos for their printing needs.
            </p>
            <Link href="/products">
              <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50 text-lg px-8">
                Get Started Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
