import { SupabaseClient } from '@supabase/supabase-js'
import { corsHeaders } from '../_shared/cors.ts'
import { CustomError } from './models.ts'

async function searchUserProfileIdByUserId(adminSupabaseClient: SupabaseClient, userId: string){
    const { data: currentUser, error } = await adminSupabaseClient.from('user_profile').select('id').eq('user_id', userId).single()
    if (error){
        throw new CustomError("User profile not found using provided user id", 404)
    } 
    return currentUser.id
}

async function checkInvitationAuthorization(adminSupabaseClient: SupabaseClient, receivedCode: string) {
    const { data: remoteInvitation, error } = await adminSupabaseClient.from('team_invitation').select('*').eq('code', receivedCode).single()
    if (error || !remoteInvitation.code) throw new CustomError("Team invitation not found using code", 404)
    return remoteInvitation
}
  
function isInvitationExpired(expirationDate: string) {
    return new Date(expirationDate).valueOf() < new Date().valueOf()
}

// async function checkInvitationType(supabaseClient: SupabaseClient, code: string, receivedInvitation: Invitation) {
//     const { data: remoteInvitation, error } = await checkInvitationExpiration(supabaseClient, code)
//     if(receivedInvitation.team_id == remoteInvitation.team_id) {
//         return remoteInvitation
//     }
//     else throw error
// }

async function joinTeamInvitation(adminSupabaseClient: SupabaseClient, userId: string, receivedCode: string) {
    const checkedInvitation = await checkInvitationAuthorization(adminSupabaseClient, receivedCode)
    if(isInvitationExpired(checkedInvitation.expiration_date)) throw new CustomError('Invitation expired', 410)
    else{
        const {data: teamUserProfileInsertion, error} = await adminSupabaseClient.from('team_user_profile').insert([
            {'team_id': checkedInvitation.team_id, 'user_profile_id': userId}
        ]);
        if (error) throw new CustomError('Error creating relationship of user profile and team', 409)
        return new Response(teamUserProfileInsertion, {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    }
}

export { joinTeamInvitation, searchUserProfileIdByUserId }