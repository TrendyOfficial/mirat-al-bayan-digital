import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Search, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

export default function ActivityLogs() {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const [logs, setLogs] = useState<any[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchLogs();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('activity_logs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activity_logs'
        },
        () => {
          fetchLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = logs.filter(log => 
        log.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredLogs(filtered);
    } else {
      setFilteredLogs(logs);
    }
  }, [searchTerm, logs]);

  const fetchLogs = async () => {
    const { data } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000);
    
    if (data) {
      setLogs(data);
      setFilteredLogs(data);
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('deleted') || action.includes('removed')) return 'destructive';
    if (action.includes('created') || action.includes('added')) return 'default';
    if (action.includes('updated') || action.includes('changed')) return 'secondary';
    return 'outline';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(isArabic ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-arabic text-3xl font-bold flex items-center gap-2">
          <Activity className="h-8 w-8" />
          {isArabic ? 'سجل النشاطات' : 'Activity Logs'}
        </h1>
        <Badge variant="secondary">
          {filteredLogs.length} {isArabic ? 'سجل' : 'logs'}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            {isArabic ? 'البحث في السجلات' : 'Search Logs'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder={isArabic ? 'ابحث بالبريد، الاسم، أو النشاط...' : 'Search by email, name, or action...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{isArabic ? 'الاسم' : 'Name'}</TableHead>
              <TableHead>{isArabic ? 'البريد الإلكتروني' : 'Email'}</TableHead>
              <TableHead>{isArabic ? 'النشاط' : 'Action'}</TableHead>
              <TableHead>{isArabic ? 'التاريخ' : 'Date'}</TableHead>
              <TableHead>{isArabic ? 'التفاصيل' : 'Details'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-medium">{log.user_name || 'N/A'}</TableCell>
                <TableCell>
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-0 h-auto font-normal">
                        {log.user_email.substring(0, 3)}***
                        <ChevronDown className="h-4 w-4 ml-1" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="text-sm text-muted-foreground">
                      {log.user_email}
                    </CollapsibleContent>
                  </Collapsible>
                </TableCell>
                <TableCell>
                  <Badge variant={getActionColor(log.action)}>
                    {log.action}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(log.created_at)}
                </TableCell>
                <TableCell>
                  {Object.keys(log.details || {}).length > 0 && (
                    <Collapsible>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm">
                          {isArabic ? 'عرض' : 'View'}
                          <ChevronDown className="h-4 w-4 ml-1" />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <pre className="text-xs bg-muted p-2 rounded mt-2 max-w-xs overflow-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
