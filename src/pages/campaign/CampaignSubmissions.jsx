import { useLocation, useNavigate, useParams } from "react-router-dom";
import VendorSubmissions from "../../components/features/campaign/VendorSubmissions";

// Own route so browser Back / refresh / deep links work.
// Campaign name arrives via router state; on a hard refresh we only have the id.
export default function CampaignSubmissions() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const campaign = state?.campaign ?? { id, name: `Campaign #${id}` };

  return <VendorSubmissions campaign={campaign} onBack={() => navigate("/app/campaigns")} />;
}
