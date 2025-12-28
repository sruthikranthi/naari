/**
 * Fantasy Events API Routes
 * 
 * GET /api/fantasy/events - List events (with optional filters)
 * POST /api/fantasy/events - Create new event (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebaseServer } from '@/firebase/server';
import type { FantasyEvent } from '@/lib/fantasy/types';
import admin from 'firebase-admin';

// Initialize Firebase
const { firestore } = initializeFirebaseServer();

/**
 * GET /api/fantasy/events
 * 
 * Query params:
 * - gameId: Filter by game ID
 * - active: Only return active events (true/false)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const gameId = searchParams.get('gameId');
    const activeOnly = searchParams.get('active') === 'true';

    let events: FantasyEvent[] = [];

    if (activeOnly) {
      const now = admin.firestore.Timestamp.now();
      let query = firestore
        .collection('fantasy_events')
        .where('isActive', '==', true)
        .where('startTime', '<=', now)
        .where('endTime', '>=', now);

      if (gameId) {
        query = query.where('gameId', '==', gameId) as any;
      }

      const snapshot = await query.orderBy('startTime', 'asc').get();
      events = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as FantasyEvent[];
    } else if (gameId) {
      const snapshot = await firestore
        .collection('fantasy_events')
        .where('gameId', '==', gameId)
        .orderBy('startTime', 'desc')
        .get();
      events = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as FantasyEvent[];
    } else {
      // Get all events (requires admin)
      // For now, return empty if no filters
      return NextResponse.json(
        { error: 'Please provide gameId or active=true filter' },
        { status: 400 }
      );
    }

    return NextResponse.json({ events });
  } catch (error: any) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/fantasy/events
 * 
 * Body: {
 *   name: string;
 *   gameId: string;
 *   description?: string;
 *   startTime: string (ISO date);
 *   endTime: string (ISO date);
 *   questionIds: string[];
 *   isActive: boolean;
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is admin (you'll need to implement this check)
    // For now, we'll assume the client handles auth
    
    const body = await request.json();
    const {
      name,
      gameId,
      description,
      startTime,
      endTime,
      questionIds,
      isActive = true,
    } = body;

    // Validate required fields
    if (!name || !gameId || !startTime || !endTime || !questionIds) {
      return NextResponse.json(
        { error: 'Missing required fields: name, gameId, startTime, endTime, questionIds' },
        { status: 400 }
      );
    }

    // Get user ID from auth token
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
    const { auth } = initializeFirebaseServer();
    let userId: string;
    
    try {
      const decodedToken = await auth.verifyIdToken(token);
      userId = decodedToken.uid;
    } catch (error) {
      return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 });
    }

    const eventData = {
      name,
      gameId,
      description,
      startTime: admin.firestore.Timestamp.fromDate(new Date(startTime)),
      endTime: admin.firestore.Timestamp.fromDate(new Date(endTime)),
      questionIds: Array.isArray(questionIds) ? questionIds : [],
      isActive,
      createdBy: userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await firestore.collection('fantasy_events').add(eventData);
    const eventId = docRef.id;

    return NextResponse.json({ 
      success: true,
      eventId,
      message: 'Event created successfully' 
    });
  } catch (error: any) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create event' },
      { status: 500 }
    );
  }
}

