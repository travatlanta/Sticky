export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { designs } from '@shared/schema';
import { eq, desc, or } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

function getOrCreateSessionId(): string {
  const cookieStore = cookies();
  let sessionId = cookieStore.get('guest_session_id')?.value;
  
  if (!sessionId) {
    sessionId = uuidv4();
  }
  
  return sessionId;
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const sessionId = getOrCreateSessionId();
    
    // Get designs for authenticated user OR anonymous session
    const userId = session?.user?.id ? String(session.user.id) : null;

    let userDesigns;
    if (userId) {
      // For logged in users, get both user designs and session designs
      userDesigns = await db
        .select()
        .from(designs)
        .where(or(eq(designs.userId, userId), eq(designs.sessionId, sessionId)))
        .orderBy(desc(designs.updatedAt));
    } else {
      // For anonymous users, only get session designs
      userDesigns = await db
        .select()
        .from(designs)
        .where(eq(designs.sessionId, sessionId))
        .orderBy(desc(designs.updatedAt));
    }

    return NextResponse.json(userDesigns);
  } catch (error) {
    console.error('Error fetching designs:', error);
    return NextResponse.json({ message: 'Failed to fetch designs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const sessionId = getOrCreateSessionId();
    
    const userId = session?.user?.id ? String(session.user.id) : null;
    const body = await request.json();

    const insertValues: Record<string, any> = {
      sessionId: sessionId,
      productId: body.productId || null,
      name: body.name || null,
      status: body.status || 'draft',
    };
    
    // Only include userId if authenticated
    if (userId) {
      insertValues.userId = userId;
    }
    
    // Only include JSONB fields if they have actual content
    if (body.canvasJson && Object.keys(body.canvasJson).length > 0) {
      insertValues.canvasJson = body.canvasJson;
    }
    if (body.selectedOptions && Object.keys(body.selectedOptions).length > 0) {
      insertValues.selectedOptions = body.selectedOptions;
    }
    if (body.previewUrl) {
      insertValues.previewUrl = body.previewUrl;
    }
    if (body.customShapeUrl) {
      insertValues.customShapeUrl = body.customShapeUrl;
    }
    if (body.highResExportUrl) {
      insertValues.highResExportUrl = body.highResExportUrl;
    }

    console.log('Insert values:', JSON.stringify(insertValues));
    
    // Use drizzle ORM insert
    const result = await db
      .insert(designs)
      .values({
        sessionId: insertValues.sessionId,
        userId: insertValues.userId,
        productId: insertValues.productId,
        name: insertValues.name,
        status: 'draft',
        canvasJson: insertValues.canvasJson,
        selectedOptions: insertValues.selectedOptions,
        previewUrl: insertValues.previewUrl,
        customShapeUrl: insertValues.customShapeUrl,
        highResExportUrl: insertValues.highResExportUrl,
      })
      .returning();
    
    console.log('Insert result length:', result?.length);
    console.log('Insert result:', result);
    
    const design = result[0];

    if (!design) {
      // If returning() didn't work, try to fetch the last inserted design
      const lastDesign = await db
        .select()
        .from(designs)
        .where(eq(designs.sessionId, sessionId))
        .orderBy(desc(designs.id))
        .limit(1);
      
      if (lastDesign.length > 0) {
        const response = NextResponse.json(lastDesign[0]);
        response.cookies.set('guest_session_id', sessionId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30,
          path: '/',
        });
        return response;
      }
      
      console.error('No design returned from insert');
      return NextResponse.json({ message: 'Failed to create design' }, { status: 500 });
    }

    // Set the session cookie if not already set
    const response = NextResponse.json(design);
    response.cookies.set('guest_session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Error creating design:', error);
    console.error('Error details:', error?.message, error?.stack);
    return NextResponse.json({ 
      message: 'Failed to create design', 
      error: error?.message || 'Unknown error'
    }, { status: 500 });
  }
}
