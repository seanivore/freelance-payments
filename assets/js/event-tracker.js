/**
 * EVENT TRACKER - Batched Event Tracking
 * Batches user events and sends them after X minutes of inactivity
 * 
 * Events tracked:
 * - contract_loaded
 * - contract_scrolled_complete
 * - invoice_viewed
 * - document_downloaded
 * - signed_contract
 * 
 * v4 schema: Updates state.client_status
 */

(function () {
  'use strict';

  const BATCH_DELAY_MS = 5 * 60 * 1000; // 5 minutes of inactivity
  const API_ENDPOINT = 'https://freelance-payments-neon.vercel.app/api/track-event';

  let eventQueue = [];
  let batchTimeout = null;

  /**
   * Queue an event for batch processing
   */
  function queueEvent(jobId, eventType, eventData = {}) {
    const event = {
      job_id: jobId,
      event_type: eventType,
      event_data: {
        ...eventData,
        timestamp: new Date().toISOString()
      }
    };

    eventQueue.push(event);
    console.log(`📊 Event queued: ${eventType} for job ${jobId} (will send after 5min inactivity or on page unload)`);

    // Reset batch timer
    if (batchTimeout) {
      clearTimeout(batchTimeout);
    }

    batchTimeout = setTimeout(() => {
      sendBatch();
    }, BATCH_DELAY_MS);
  }

  /**
   * Send batched events to API
   */
  async function sendBatch() {
    if (eventQueue.length === 0) {
      return;
    }

    const eventsToSend = [...eventQueue];
    eventQueue = []; // Clear queue

    console.log(`📤 Sending ${eventsToSend.length} batched event(s) to API...`);

    // Send each event (API handles batching on backend if needed)
    for (const event of eventsToSend) {
      try {
        const response = await fetch(API_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event)
        });

        if (response.ok) {
          console.log(`✅ Event sent: ${event.event_type} for job ${event.job_id}`);
        } else {
          console.warn(`⚠️ Event API returned ${response.status} for ${event.event_type}`);
          // Re-queue failed events
          eventQueue.push(event);
        }
      } catch (e) {
        console.warn('❌ Failed to track event:', e);
        // Re-queue failed events
        eventQueue.push(event);
      }
    }
  }

  /**
   * Track contract loaded
   */
  function trackContractLoaded(jobId) {
    queueEvent(jobId, 'contract_loaded');
  }

  /**
   * Track contract scrolled complete
   */
  function trackContractScrolledComplete(jobId) {
    queueEvent(jobId, 'contract_scrolled_complete');
  }

  /**
   * Track invoice viewed
   */
  function trackInvoiceViewed(jobId, paymentNumber) {
    queueEvent(jobId, 'invoice_viewed', { payment_number: paymentNumber });
  }

  /**
   * Track document downloaded
   */
  function trackDocumentDownloaded(jobId, documentType) {
    queueEvent(jobId, 'document_downloaded', { document_type: documentType });
  }

  /**
   * Track contract signed
   */
  function trackContractSigned(jobId) {
    queueEvent(jobId, 'contract_signed');
  }

  /**
   * Force send batch immediately (e.g., on page unload)
   */
  function flushBatch() {
    if (batchTimeout) {
      clearTimeout(batchTimeout);
      batchTimeout = null;
    }
    sendBatch();
  }

  // Flush batch on page unload
  window.addEventListener('beforeunload', flushBatch);

  // Export for use in other scripts
  window.EventTracker = {
    trackContractLoaded,
    trackContractScrolledComplete,
    trackInvoiceViewed,
    trackDocumentDownloaded,
    trackContractSigned,
    flushBatch
  };

})();
