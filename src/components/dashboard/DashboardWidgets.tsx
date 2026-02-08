import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";
import { format } from "date-fns";
import { 
  Calendar, 
  Phone, 
  User, 
  Car, 
  TrendingUp, 
  Eye, 
  MessageSquare,
  ArrowRight,
  Clock,
  AlertCircle
} from "lucide-react";
import { Link } from "react-router-dom";

interface UpcomingFollowUp {
  id: string;
  customer_name: string;
  phone: string;
  follow_up_date: string;
  vehicle_interest?: string;
  priority: string;
}

interface RecentLead {
  id: string;
  customer_name: string;
  source: string;
  created_at: string;
  status: string;
}

interface PerformingVehicle {
  id: string;
  brand: string;
  model: string;
  image_url?: string;
  views: number;
  enquiries: number;
  selling_price: number;
}

interface QuickOverview {
  marketplace_views: number;
  marketplace_enquiries: number;
  catalogue_views: number;
  catalogue_enquiries: number;
}

interface OutstandingPayment {
  id: string;
  customer_name: string;
  vehicle_name: string;
  amount: number;
  due_date?: string;
}

interface DashboardWidgetsProps {
  upcomingFollowUps: UpcomingFollowUp[];
  recentLeads: RecentLead[];
  topMarketplaceVehicle?: PerformingVehicle;
  topCatalogueVehicle?: PerformingVehicle;
  quickOverview: QuickOverview;
  outstandingPayments: OutstandingPayment[];
  pendingAmounts: number;
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'bg-destructive/10 text-destructive border-destructive/30';
    case 'medium': return 'bg-chart-3/10 text-chart-3 border-chart-3/30';
    default: return 'bg-muted text-muted-foreground border-muted';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'new': return 'bg-chart-1/10 text-chart-1 border-chart-1/30';
    case 'contacted': return 'bg-chart-2/10 text-chart-2 border-chart-2/30';
    case 'qualified': return 'bg-chart-3/10 text-chart-3 border-chart-3/30';
    default: return 'bg-muted text-muted-foreground border-muted';
  }
};

export const UpcomingFollowUpsWidget = ({ followUps }: { followUps: UpcomingFollowUp[] }) => (
  <Card className="border border-border bg-card rounded-xl">
    <CardHeader className="pb-3 flex flex-row items-center justify-between">
      <CardTitle className="text-base font-semibold flex items-center gap-2">
        <Calendar className="h-4 w-4 text-chart-1" />
        Upcoming Follow-ups
      </CardTitle>
      <Link to="/leads">
        <Button variant="ghost" size="sm" className="text-xs gap-1">
          View All <ArrowRight className="h-3 w-3" />
        </Button>
      </Link>
    </CardHeader>
    <CardContent className="space-y-3">
      {followUps.length > 0 ? (
        followUps.slice(0, 4).map((fu) => (
          <div key={fu.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-full bg-chart-1/10 flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-chart-1" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{fu.customer_name}</p>
                <p className="text-xs text-muted-foreground truncate">{fu.vehicle_interest || 'General Enquiry'}</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <Badge variant="outline" className={`text-xs ${getPriorityColor(fu.priority)}`}>
                {fu.priority}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(fu.follow_up_date), 'dd MMM')}
              </p>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-6 text-muted-foreground">
          <Calendar className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No follow-ups scheduled</p>
        </div>
      )}
    </CardContent>
  </Card>
);

export const RecentLeadsWidget = ({ leads }: { leads: RecentLead[] }) => (
  <Card className="border border-border bg-card rounded-xl">
    <CardHeader className="pb-3 flex flex-row items-center justify-between">
      <CardTitle className="text-base font-semibold flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-chart-2" />
        Recent Leads
      </CardTitle>
      <Link to="/leads">
        <Button variant="ghost" size="sm" className="text-xs gap-1">
          View All <ArrowRight className="h-3 w-3" />
        </Button>
      </Link>
    </CardHeader>
    <CardContent className="space-y-3">
      {leads.length > 0 ? (
        leads.slice(0, 4).map((lead) => (
          <div key={lead.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-full bg-chart-2/10 flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-chart-2" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{lead.customer_name}</p>
                <p className="text-xs text-muted-foreground">via {lead.source}</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <Badge variant="outline" className={`text-xs ${getStatusColor(lead.status)}`}>
                {lead.status}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(lead.created_at), 'dd MMM')}
              </p>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-6 text-muted-foreground">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No recent leads</p>
        </div>
      )}
    </CardContent>
  </Card>
);

export const PerformingVehicleWidget = ({ 
  vehicle, 
  type 
}: { 
  vehicle?: PerformingVehicle; 
  type: 'marketplace' | 'catalogue' 
}) => (
  <Card className="border border-border bg-card rounded-xl">
    <CardHeader className="pb-3">
      <CardTitle className="text-base font-semibold flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-chart-3" />
        Top {type === 'marketplace' ? 'Marketplace' : 'Catalogue'} Vehicle
      </CardTitle>
    </CardHeader>
    <CardContent>
      {vehicle ? (
        <div className="space-y-3">
          <div className="aspect-video bg-muted rounded-lg overflow-hidden">
            {vehicle.image_url ? (
              <img 
                src={vehicle.image_url} 
                alt={`${vehicle.brand} ${vehicle.model}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Car className="h-12 w-12 text-muted-foreground/40" />
              </div>
            )}
          </div>
          <div>
            <h4 className="font-semibold">{vehicle.brand} {vehicle.model}</h4>
            <p className="text-lg font-bold text-chart-2">{formatCurrency(vehicle.selling_price)}</p>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Eye className="h-4 w-4" />
              <span>{vehicle.views} views</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <MessageSquare className="h-4 w-4" />
              <span>{vehicle.enquiries} enquiries</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Car className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No data available</p>
        </div>
      )}
    </CardContent>
  </Card>
);

export const QuickOverviewWidget = ({ overview }: { overview: QuickOverview }) => (
  <Card className="border border-border bg-card rounded-xl">
    <CardHeader className="pb-3">
      <CardTitle className="text-base font-semibold flex items-center gap-2">
        <Clock className="h-4 w-4 text-chart-4" />
        Today's Overview
      </CardTitle>
    </CardHeader>
    <CardContent className="grid grid-cols-2 gap-4">
      <div className="p-3 bg-chart-1/5 rounded-lg border border-chart-1/20">
        <p className="text-xs text-muted-foreground uppercase">Marketplace Views</p>
        <p className="text-2xl font-bold text-chart-1">{overview.marketplace_views}</p>
      </div>
      <div className="p-3 bg-chart-2/5 rounded-lg border border-chart-2/20">
        <p className="text-xs text-muted-foreground uppercase">Marketplace Enquiries</p>
        <p className="text-2xl font-bold text-chart-2">{overview.marketplace_enquiries}</p>
      </div>
      <div className="p-3 bg-chart-3/5 rounded-lg border border-chart-3/20">
        <p className="text-xs text-muted-foreground uppercase">Catalogue Views</p>
        <p className="text-2xl font-bold text-chart-3">{overview.catalogue_views}</p>
      </div>
      <div className="p-3 bg-chart-4/5 rounded-lg border border-chart-4/20">
        <p className="text-xs text-muted-foreground uppercase">Catalogue Enquiries</p>
        <p className="text-2xl font-bold text-chart-4">{overview.catalogue_enquiries}</p>
      </div>
    </CardContent>
  </Card>
);

export const OutstandingPaymentsWidget = ({ payments, pendingAmount }: { payments: OutstandingPayment[]; pendingAmount: number }) => (
  <Card className="border border-border bg-card rounded-xl">
    <CardHeader className="pb-3 flex flex-row items-center justify-between">
      <CardTitle className="text-base font-semibold flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-destructive" />
        Outstanding Payments
      </CardTitle>
      <Link to="/payments">
        <Button variant="ghost" size="sm" className="text-xs gap-1">
          View All <ArrowRight className="h-3 w-3" />
        </Button>
      </Link>
    </CardHeader>
    <CardContent className="space-y-3">
      <div className="p-4 bg-destructive/5 rounded-lg border border-destructive/20">
        <p className="text-xs text-muted-foreground uppercase">Total Pending</p>
        <p className="text-2xl font-bold text-destructive">{formatCurrency(pendingAmount)}</p>
      </div>
      {payments.length > 0 ? (
        payments.slice(0, 3).map((payment) => (
          <div key={payment.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{payment.customer_name}</p>
              <p className="text-xs text-muted-foreground truncate">{payment.vehicle_name}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-semibold text-destructive">{formatCurrency(payment.amount)}</p>
              {payment.due_date && (
                <p className="text-xs text-muted-foreground">
                  Due: {format(new Date(payment.due_date), 'dd MMM')}
                </p>
              )}
            </div>
          </div>
        ))
      ) : (
        <p className="text-sm text-muted-foreground text-center py-2">No outstanding payments</p>
      )}
    </CardContent>
  </Card>
);
