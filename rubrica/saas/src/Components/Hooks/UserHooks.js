import { useEffect, useState } from "react";
import { getLoggedinUser } from "../../helpers/api_helper";

const useProfile = () => {
  const userProfileSession = getLoggedinUser();
  var token = userProfileSession ? (userProfileSession.token || userProfileSession.accessToken) : null;
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(userProfileSession || null);

  useEffect(() => {
    const session = getLoggedinUser();
    var tok = session ? (session.token || session.accessToken) : null;
    setUserProfile(session || null);
    setLoading(false);
  }, []);

  return { userProfile, loading, token };
};

export { useProfile };