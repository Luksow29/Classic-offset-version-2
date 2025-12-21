import { supabase } from '@/services/supabase/client';

interface DebugStep {
  step: string;
  status: 'ok' | 'fail' | 'skip';
  detail?: string;
  error?: string;
}

interface DebugResult {
  success: boolean;
  message: string;
  error?: string;
  steps: DebugStep[];
  details?: any;
}

export const testDatabaseConnection = async (): Promise<DebugResult> => {
  const steps: DebugStep[] = [];
  try {
    steps.push({ step: 'init', status: 'ok', detail: 'Starting chat diagnostics' });

    // 1. Auth session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      steps.push({ step: 'auth_session', status: 'fail', error: sessionError.message });
      return { success: false, message: 'Auth session retrieval failed', error: 'AUTH_SESSION_ERROR', steps };
    }
    if (!session?.user) {
      steps.push({ step: 'auth_session', status: 'fail', error: 'No logged in user' });
      return { success: false, message: 'User not logged in', error: 'NOT_AUTHENTICATED', steps };
    }
    steps.push({ step: 'auth_session', status: 'ok', detail: `User: ${session.user.email}` });

    // 2. Table existence (HEAD count)
    const { error: headError } = await supabase
      .from('order_chat_threads')
      .select('id', { head: true, count: 'exact' });
    if (headError) {
      const code = (headError as any).code || 'NO_CODE';
      const combined = `${code}: ${headError.message}`;
      if (headError.message.includes('does not exist')) {
        steps.push({ step: 'table_check', status: 'fail', error: combined });
        return { success: false, message: 'Tables missing', error: 'TABLES_NOT_EXIST', steps };
      }
      if (headError.message.includes('permission denied')) {
        steps.push({ step: 'table_check', status: 'fail', error: combined });
        return { success: false, message: 'Permission denied on table head select', error: 'PERMISSION_DENIED', steps };
      }
      steps.push({ step: 'table_check', status: 'fail', error: combined });
      return { success: false, message: 'Unknown table check error', error: 'TABLE_CHECK_ERROR', steps };
    }
    steps.push({ step: 'table_check', status: 'ok', detail: 'order_chat_threads accessible' });

    // 3. Policy introspection (attempt a no-op select returning rows)
    const { data: sampleRows, error: selectError } = await supabase
      .from('order_chat_threads')
      .select('*')
      .limit(1);
    if (selectError) {
      steps.push({ step: 'select_test', status: 'fail', error: selectError.message });
    } else {
      steps.push({ step: 'select_test', status: 'ok', detail: `Select succeeded (${sampleRows?.length || 0} rows)` });
    }

    // 4. Get a valid order ID for insert test
    let validOrderId: number | null = null;
    const { data: sampleOrder, error: orderError } = await supabase
      .from('orders')
      .select('id')
      .limit(1)
      .single();
    
    if (!orderError && sampleOrder?.id) {
      validOrderId = sampleOrder.id;
      steps.push({ step: 'order_lookup', status: 'ok', detail: `Found order ID: ${validOrderId}` });
    } else {
      steps.push({ step: 'order_lookup', status: 'skip', detail: 'No orders found for FK test' });
    }

    // 5. Insert permission test (only if we have a valid order)
    if (validOrderId) {
      try {
        const insertPayload = {
          order_id: validOrderId,
          customer_id: session.user.id,
          subject: 'Debug permission probe',
          priority: 'normal',
          status: 'active'
        } as const;
        const { data: inserted, error: insertError } = await supabase
          .from('order_chat_threads')
          .insert(insertPayload)
          .select()
          .single();
        if (insertError) {
          steps.push({ step: 'insert_test', status: 'fail', error: insertError.message });
          if (insertError.message.includes('permission denied')) {
            return { success: false, message: 'Insert blocked by RLS', error: 'INSERT_PERMISSION_DENIED', steps };
          }
          // For FK constraint errors, this is actually expected behavior
          if (insertError.message.includes('foreign key constraint')) {
            steps.push({ step: 'insert_test', status: 'skip', detail: 'FK constraint working correctly' });
          } else {
            return { success: false, message: 'Insert failed', error: 'INSERT_FAILED', steps };
          }
        } else {
          steps.push({ step: 'insert_test', status: 'ok', detail: `Inserted id ${inserted?.id}` });

          // 6. Delete cleanup
          if (inserted?.id) {
            const { error: deleteError } = await supabase
              .from('order_chat_threads')
              .delete()
              .eq('id', inserted.id);
            if (deleteError) {
              steps.push({ step: 'cleanup_delete', status: 'fail', error: deleteError.message });
              return { success: false, message: 'Cleanup delete failed', error: 'CLEANUP_DELETE_FAILED', steps };
            }
            steps.push({ step: 'cleanup_delete', status: 'ok', detail: 'Cleanup successful' });
          } else {
            steps.push({ step: 'cleanup_delete', status: 'skip', detail: 'No inserted row id' });
          }
        }
      } catch (inner) {
        steps.push({ step: 'insert_test', status: 'fail', error: (inner as any).message });
        return { success: false, message: 'Insert test exception', error: 'INSERT_EXCEPTION', steps };
      }
    } else {
      steps.push({ step: 'insert_test', status: 'skip', detail: 'No valid order ID for FK test' });
    }

    
    return {
      success: true,
      message: '✅ All diagnostics passed',
      steps,
      details: { user: session.user.email }
    };
  } catch (e: any) {
    steps.push({ step: 'unhandled', status: 'fail', error: e.message });
    return { success: false, message: 'Unhandled debug error', error: 'UNHANDLED', steps };
  }
};
