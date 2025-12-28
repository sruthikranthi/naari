/**
 * Fantasy Event API Routes (Single Event)
 * 
 * GET /api/fantasy/events/[id] - Get event by ID
 * PUT /api/fantasy/events/[id] - Update event (admin only)
 * DELETE /api/fantasy/events/[id] - Delete event (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebaseServer } from '@/firebase/server';
import type { FantasyEvent } from '@/lib/fantasy/types';
import admin from 'firebase-admin';

// Initialize Firebase
const { firestore, auth } = initializeFirebaseServer();

/**
 * GET /api/fantasy/events/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const eventDoc = await firestore.collection('fantasy_events').doc(eventId).get();

    if (!eventDoc.exists) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const event = { id: eventDoc.id, ...eventDoc.data() } as FantasyEvent;

    return NextResponse.json({ event });
  } catch (error: any) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch event' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/fantasy/events/[id]
 * 
 * Body: Partial<FantasyEvent> (all fields optional except id)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Verify user is admin

    const { id: eventId } = await params;
    const body = await request.json();

    // Validate event exists
    const eventRef = firestore.collection('fantasy_events').doc(eventId);
    const existingEvent = await eventRef.get();
    
    if (!existingEvent.exists) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Prepare updates
    const updates: any = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.startTime !== undefined) {
      updates.startTime = admin.firestore.Timestamp.fromDate(new Date(body.startTime));
    }
    if (body.endTime !== undefined) {
      updates.endTime = admin.firestore.Timestamp.fromDate(new Date(body.endTime));
    }
    if (body.questionIds !== undefined) {
      updates.questionIds = Array.isArray(body.questionIds) ? body.questionIds : [];
    }
    if (body.isActive !== undefined) updates.isActive = body.isActive;

    await eventRef.update(updates);

    return NextResponse.json({ 
      success: true,
      message: 'Event updated successfully' 
    });
  } catch (error: any) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update event' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/fantasy/events/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Verify user is admin

    const { id: eventId } = await params;

    // Validate event exists
    const eventRef = firestore.collection('fantasy_events').doc(eventId);
    const existingEvent = await eventRef.get();
    
    if (!existingEvent.exists) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    await eventRef.delete();

    return NextResponse.json({ 
      success: true,
      message: 'Event deleted successfully' 
    });
  } catch (error: any) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete event' },
      { status: 500 }
    );
  }
}

